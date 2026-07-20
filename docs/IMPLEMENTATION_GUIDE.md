# Hướng dẫn thêm 3 tính năng mới vào Login Page

## ✅ Các file đã được tạo:

1. `src/loginEnhancements.css` - CSS styles cho 3 tính năng
2. `src/LoginEnhancements.jsx` - React components cho 3 tính năng
3. Import đã được thêm vào đầu `src/App.jsx`

## 📝 Các bước tiếp theo:

### Bước 1: Thêm Language Switcher vào JSX

Tìm trong `src/App.jsx`, trong function `LoginPage`, tìm dòng:

```jsx
return (
  <main className="login-shell" aria-label="Login">
```

Thêm ngay sau dòng `<main>`:

```jsx
<main className="login-shell" aria-label="Login">
  {/* Language Switcher */}
  <LanguageSwitcher
    selectedLanguage={selectedLanguage}
    onLanguageChange={handleLanguageChange}
  />
```

### Bước 2: Thêm Help & Support button

Tìm dòng đóng `</main>` trong LoginPage, thêm ngay trước nó:

```jsx
      {/* Help & Support */}
      <HelpSupport translations={t} />
    </main>
```

### Bước 3: Thêm Password Strength Indicator

Tìm trong LoginPage, tìm phần password input (dòng có `type={showPassword ? "text" : "password"}`).

Ngay sau thẻ `</span>` đóng của `password-input`, thêm:

```jsx
            </span>
          </label>

          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator
            password={password}
            strength={passwordStrength}
          />

          <div className="login-options">
```

### Bước 4: Cập nhật text với translations

Thay đổi các text trong LoginPage để sử dụng biến `t` (translations):

```jsx
// Thay đổi:
<h1 style={{ textAlign: "center" }}>Welcome to ScholarTrend</h1>
// Thành:
<h1 style={{ textAlign: "center" }}>{t.welcome}</h1>

// Thay đổi:
<p style={{ textAlign: "center" }}>Please enter your credentials to access your dashboard.</p>
// Thành:
<p style={{ textAlign: "center" }}>{t.subtitle}</p>

// Thay đổi:
<span>Email Address</span>
// Thành:
<span>{t.email}</span>

// Thay đổi:
<span>Academic Role</span>
// Thành:
<span>{t.role}</span>

// Thay đổi:
<span>Password</span>
// Thành:
<span>{t.password}</span>

// Thay đổi:
Remember me
// Thành:
{t.rememberMe}

// Thay đổi:
Forgot password?
// Thành:
{t.forgotPassword}

// Thay đổi:
<span>{isLoggingIn ? "Signing In..." : "Sign In"}</span>
// Thành:
<span>{isLoggingIn ? t.signingIn : t.signIn}</span>

// Thay đổi:
<span>OR</span>
// Thành:
<span>{t.or}</span>
```

## 🎯 Kết quả mong đợi:

1. **Language Switcher** sẽ xuất hiện ở góc trên phải với cờ và tên ngôn ngữ
2. **Help & Support button** sẽ xuất hiện ở góc dưới phải với icon chatbot tròn
3. **Password Strength Indicator** sẽ xuất hiện ngay dưới ô password với thanh màu và gợi ý

## 🔧 Troubleshooting:

Nếu không thấy components:

1. Đảm bảo import đã được thêm ở đầu file
2. Check console browser xem có lỗi không
3. Đảm bảo file CSS đã được tạo đúng đường dẫn
4. Refresh hard (Ctrl + Shift + R) trên browser

## 📸 Preview chức năng:

- Chọn ngôn ngữ EN/VI → Tất cả text trên trang sẽ đổi ngôn ngữ
- Click Help button → Menu hiện ra với 3 options
- Gõ password → Thanh màu hiện lên với label (Weak/Fair/Good/Strong)
