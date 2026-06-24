/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Employee, SecurityLog } from '../types';
import { hashPassword } from '../lib/crypto';
import { useAppTheme } from './ThemeContext';
import { Lock, User, Key, Eye, EyeOff, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Clock } from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onLoginSuccess: (user: Employee) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onAddSecurityLog: (action: SecurityLog['action'], username: string, details: string, severity: SecurityLog['severity']) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  setEmployees,
  onLoginSuccess,
  onShowToast,
  onAddSecurityLog
}) => {
  const { primaryBg, primaryText, primaryHoverBg } = useAppTheme();

  // Mode: 'employee' or 'admin'
  const [loginMode, setLoginMode] = useState<'employee' | 'admin'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // First login password change state
  const [changePasswordUser, setChangePasswordUser] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Hidden admin activation
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rate Limiting & Failed attempts
  const [failedAttempts, setFailedAttempts] = useState<{ [username: string]: number }>({});
  const [lockoutTime, setLockoutTime] = useState<{ [username: string]: number }>({});
  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for locked-out username
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Unlock current username
            const activeLockedUser = Object.keys(lockoutTime).find(u => lockoutTime[u] > Date.now());
            if (activeLockedUser) {
              setLockoutTime(prevLock => {
                const updated = { ...prevLock };
                delete updated[activeLockedUser];
                return updated;
              });
              setFailedAttempts(prevFail => {
                const updated = { ...prevFail };
                updated[activeLockedUser] = 0;
                return updated;
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown, lockoutTime]);

  // Handle Logo Triple Tap
  const handleLogoClick = () => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    setLogoClicks(prev => {
      const nextClicks = prev + 1;
      
      if (nextClicks === 3) {
        // Schedule side-effects outside of the pure state updater function
        setTimeout(() => {
          setLoginMode('admin');
          onShowToast('🔐 تم رصد النقر الثلاثي: تم فتح بوابة تسجيل دخول الإدارة الفائقة!', 'info');
          onAddSecurityLog('login_success', 'system', 'تم تفعيل بوابة الإدارة الفائقة عبر النقر الثلاثي على الشعار', 'low');
          setUsername('');
          setPassword('');
        }, 0);
        return 0;
      }

      // Reset clicks after 1.5 seconds of inactivity
      clickTimerRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 1500);

      return nextClicks;
    });
  };

  // Perform login checks
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      onShowToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
      return;
    }

    const trimmedUsername = username.trim();

    // Check if locked out
    const isLocked = lockoutTime[trimmedUsername] && lockoutTime[trimmedUsername] > Date.now();
    if (isLocked) {
      const remaining = Math.ceil((lockoutTime[trimmedUsername] - Date.now()) / 1000);
      setCountdown(remaining);
      onShowToast(`⚠️ الحساب مقفل مؤقتاً بسبب محاولات خاطئة متكررة. يرجى الانتظار ${remaining} ثانية`, 'error');
      return;
    }

    // Hash the entered password
    const hashedEnteredPassword = hashPassword(password);

    if (loginMode === 'admin') {
      // Super Admin login check: Username '1', password 'GCC' (hashed)
      const adminEmployee = employees.find(emp => emp.code === '1' && emp.role === 'admin');
      
      if (trimmedUsername === '1' && adminEmployee && adminEmployee.passwordHash === hashedEnteredPassword) {
        // Successful login
        setFailedAttempts(prev => ({ ...prev, [trimmedUsername]: 0 }));
        onAddSecurityLog('login_success', '1', 'تسجيل دخول ناجح لمدير النظام الرئيسي (م / أيمن)', 'low');
        onShowToast('🔓 أهلاً بك مهندس أيمن، تم تسجيل دخولك بنجاح بكامل الصلاحيات الإدارية', 'success');
        onLoginSuccess(adminEmployee);
      } else {
        // Failed login
        handleFailedAttempt(trimmedUsername);
      }
    } else {
      // Regular Employee login check
      const matchedEmployee = employees.find(emp => emp.code === trimmedUsername);

      if (matchedEmployee && matchedEmployee.code !== '1') {
        if (matchedEmployee.passwordHash === hashedEnteredPassword) {
          // Check if force change password is required
          if (matchedEmployee.mustChangePassword) {
            setChangePasswordUser(matchedEmployee);
            onShowToast('⚠️ لتأمين حسابك، يرجى تعيين كلمة مرور جديدة قبل الدخول لأول مرة', 'info');
            return;
          }

          // Successful login
          setFailedAttempts(prev => ({ ...prev, [trimmedUsername]: 0 }));
          onAddSecurityLog('login_success', trimmedUsername, `تسجيل دخول ناجح للموظف (${matchedEmployee.name})`, 'low');
          onShowToast(`🔓 تم تسجيل دخولك بنجاح، مرحباً بك ${matchedEmployee.name}`, 'success');
          onLoginSuccess(matchedEmployee);
        } else {
          // Failed login
          handleFailedAttempt(trimmedUsername);
        }
      } else {
        // Employee code not found
        handleFailedAttempt(trimmedUsername);
      }
    }
  };

  // Failed login tracking
  const handleFailedAttempt = (userCode: string) => {
    const attempts = (failedAttempts[userCode] || 0) + 1;
    setFailedAttempts(prev => ({ ...prev, [userCode]: attempts }));
    
    onAddSecurityLog('login_failed', userCode, `محاولة تسجيل دخول فاشلة رقم ${attempts}`, 'medium');

    if (attempts >= 5) {
      const lockDuration = 30000; // 30 seconds lock
      const unlockTime = Date.now() + lockDuration;
      setLockoutTime(prev => ({ ...prev, [userCode]: unlockTime }));
      setCountdown(30);
      onShowToast('🚨 تم قفل تسجيل الدخول مؤقتاً لحماية الحساب لمدة 30 ثانية', 'error');
      onAddSecurityLog('rate_limit_locked', userCode, 'تم تطبيق حد السرعة وقفل الحساب مؤقتاً بسبب تكرار المحاولات الفاشلة', 'high');
    } else {
      onShowToast(`❌ كلمة مرور أو رقم وظيفي خاطئ. المحاولات المتبقية: ${5 - attempts}`, 'error');
    }
  };

  // Password Change Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!changePasswordUser) return;

    if (newPassword.length < 4) {
      onShowToast('يجب أن تكون كلمة المرور الجديدة مكونة من 4 خانات على الأقل', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onShowToast('تأكيد كلمة المرور غير متطابق', 'error');
      return;
    }

    if (hashPassword(newPassword) === changePasswordUser.passwordHash) {
      onShowToast('يجب ألا تطابق كلمة المرور الجديدة كلمة المرور المؤقتة السابقة', 'error');
      return;
    }

    // Save updated password in state
    setEmployees(prev => prev.map(emp => {
      if (emp.id === changePasswordUser.id) {
        return {
          ...emp,
          passwordHash: hashPassword(newPassword),
          mustChangePassword: false
        };
      }
      return emp;
    }));

    onAddSecurityLog('password_changed', changePasswordUser.code, 'تمت تسوية الحساب وتغيير كلمة المرور المؤقتة بنجاح', 'medium');
    onShowToast('✓ تم تغيير كلمة المرور وتأمين حسابك بنجاح! جاري تسجيل الدخول...', 'success');

    // Automatically log in
    const updatedUser: Employee = {
      ...changePasswordUser,
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false
    };
    
    // Reset change state and log in
    setChangePasswordUser(null);
    onLoginSuccess(updatedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300" style={{ direction: 'rtl' }}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8 relative">
        
        {/* TOP GLOW PATTERN */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-blue-500 to-indigo-600"></div>

        {/* --- CHANGE PASSWORD VIEW (FOR FIRST LOGIN) --- */}
        {changePasswordUser ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تحديث كلمة المرور المؤقتة</h2>
              <p className="text-xs text-slate-400 mt-1">
                مرحباً بك <strong>{changePasswordUser.name}</strong>. يرجى تفعيل حسابك بإنشاء كلمة مرور خاصة بك.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور الجديدة</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="أدخل كلمة مرور قوية"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">تأكيد كلمة المرور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="أعد كتابة كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer ${primaryBg} ${primaryHoverBg}`}
              >
                تأكيد وتحديث كلمة المرور والدخول
              </button>

              <button
                type="button"
                onClick={() => setChangePasswordUser(null)}
                className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
              >
                العودة لصفحة تسجيل الدخول
              </button>
            </form>
          </div>
        ) : (
          /* --- MAIN LOGIN FORM VIEW --- */
          <div className="space-y-6">
            
            {/* LOGO & CLICKS TRACKER */}
            <div className="text-center space-y-3">
              <div 
                onClick={handleLogoClick}
                className="mx-auto w-20 h-20 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md select-none group"
                title="اضغط 3 مرات للدخول الفائق"
              >
                {/* Embedded SVG GCC Logo mirroring the real logo attachment */}
                <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" fill="#1565C0" />
                  {/* 3D Box/Cube with G and C */}
                  <path d="M50 22 L75 35 L75 65 L50 78 L25 65 L25 35 Z" stroke="white" strokeWidth="4" strokeLinejoin="round" fill="#1565C0" />
                  <path d="M50 22 L50 78" stroke="white" strokeWidth="2" />
                  <path d="M25 35 L75 35" stroke="white" strokeWidth="2" />
                  <path d="M25 65 L75 65" stroke="white" strokeWidth="2" />
                  <path d="M50 50 L75 35" stroke="white" strokeWidth="3" />
                  <path d="M50 50 L25 35" stroke="white" strokeWidth="3" />
                  <path d="M50 50 L50 78" stroke="white" strokeWidth="3" />
                  
                  {/* G Top side representation */}
                  <path d="M40 30 H60" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M60 30 V35 H50" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" />

                  {/* C Right/Left sides representation */}
                  <path d="M30 45 H40 V55 H30" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M60 45 H70 V55 H60" stroke="#FFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center gap-1.5 font-sans">
                  <span>بوابة دخول</span>
                  <span className={primaryText}>CoreOps</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  {loginMode === 'admin' ? '🔐 لوحة تحكم مدير النظام الفائق' : '👷 النظام الميداني وإدارة العهد المتكاملة'}
                </p>
              </div>
            </div>

            {/* ERROR COUNTDOWN / BLOCKING HUD */}
            {countdown > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60 p-3.5 rounded-2xl text-center space-y-1">
                <div className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>تم تجميد حسابك مؤقتاً لحمايته!</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  يرجى الانتظار <strong className="text-rose-600 font-mono text-xs">{countdown}</strong> ثانية لإعادة تفعيل المحاولة.
                </p>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {loginMode === 'admin' ? 'الرمز التعريفي الفائق' : 'الرقم الوظيفي'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={countdown > 0}
                    placeholder={loginMode === 'admin' ? 'أدخل الرقم التعريفي للإدارة' : 'مثال: 1001'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={countdown > 0}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={countdown > 0}
                className={`w-full text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer ${
                  countdown > 0 
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                    : `${primaryBg} ${primaryHoverBg}`
                }`}
              >
                {loginMode === 'admin' ? 'دخول فائق للوحة التحكم' : 'تسجيل الدخول للنظام الميداني'}
              </button>
            </form>

            {/* RETREAT TOGGLE FOR ADMIN */}
            {loginMode === 'admin' && (
              <button
                onClick={() => {
                  setLoginMode('employee');
                  setUsername('');
                  setPassword('');
                }}
                className="w-full text-center text-[11px] font-bold text-blue-600 hover:underline cursor-pointer pt-2 block font-sans"
              >
                ← العودة لتسجيل دخول الموظفين العاديين
              </button>
            )}

            {/* SECURE HUD FOOTER NOTES */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-[10px] text-slate-400 leading-relaxed text-center font-sans">
              🔒 نظام آمن ومحمي بموجب لوائح GCC للسلامة. يتم تسجيل وحفظ كافة محاولات الدخول وعناوين بروتوكول الإنترنت لضمان موثوقية العمل الميداني.
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
