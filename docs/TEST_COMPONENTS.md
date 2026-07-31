# Test Components - Debug Guide

## Bước 1: Mở Browser Console

1. Mở trang login: http://localhost:5174/login
2. Nhấn F12 để mở DevTools
3. Chuyển sang tab Console
4. Xem có lỗi màu đỏ không?

## Bước 2: Test Language Switcher

1. Nhìn góc trên phải - có thấy nút "🇬🇧 English" không?
2. Click vào nút đó
3. Menu dropdown có hiện ra không?
4. Click "Tiếng Việt" - text có đổi không?

## Bước 3: Test Help Button

1. Nhìn góc dưới phải - có thấy nút tròn màu xanh không?
2. Click vào nút tròn
3. Menu có hiện lên không?
4. Click "How to login?" - có alert hiện ra không?

## Bước 4: Test Password Strength

1. Click vào ô Password
2. Gõ: "abc" → Thanh màu đỏ, label "Weak"
3. Gõ: "Abc123!" → Thanh màu xanh, label "Good" hoặc "Strong"
4. Có thấy emoji 🔒 và 💡 không?

## Nếu không hoạt động:

Gửi cho tôi:

1. Screenshot console (có lỗi màu đỏ không?)
2. Screenshot trang login
3. Text lỗi nếu có

## Expected Result:

✅ Language Switcher: Góc trên phải, có thể click và đổi ngôn ngữ
✅ Help Button: Góc dưới phải, màu xanh gradient
✅ Password Strength: Dưới ô password, thanh màu thay đổi
