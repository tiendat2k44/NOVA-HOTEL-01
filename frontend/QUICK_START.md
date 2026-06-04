/**
 * QUICK START - Nova Hotel Frontend Refactor (LỖI THỜI)
 * =====================================================
 * 
 * ⚠️  LƯU Ý QUAN TRỌNG:
 * File này được viết khi dự án định refactor sang React + Vite.
 * HIỆN TẠI frontend đang dùng HTML + JS thuần → các lệnh npm run dev, 
 * cấu trúc src/data/*, Home.jsx... KHÔNG TỒN TẠI.
 *
 * Hướng dẫn chạy thật → xem CACH_CHAY_FRONTEND.md hoặc dùng start-frontend.bat
 */

# 📁 Cấu Trúc Thư Mục

```
src/
├── data/              # 📊 Dữ liệu Mock
│   ├── rooms.js       # Mảng ROOMS
│   ├── features.js    # Mảng FEATURES
│   └── reviews.js     # Mảng REVIEWS
│
├── styles/            # 🎨 CSS
│   ├── global.css     # Global + animations
│   └── Home.module.css # Component styles
│
├── components/
│   ├── common/        # Navbar, Footer (không thay đổi)
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   │
│   └── home/          # ✨ Home Page Components
│       ├── HeroSection.jsx
│       ├── SearchBar.jsx
│       ├── RoomList.jsx
│       ├── RoomCard.jsx
│       ├── FeaturesSection.jsx
│       ├── FeatureCard.jsx
│       ├── StatsSection.jsx
│       ├── ReviewsSection.jsx
│       ├── CTASection.jsx
│       └── SectionContainer.jsx
│
└── pages/customer/
    ├── Home.jsx       # Main page (tổ hợp tất cả)
    ├── Login.jsx      # (không thay đổi)
    ├── Register.jsx   # (không thay đổi)
    └── ...
```

# 🚀 Chạy Dev Server

```bash
# Terminal 1: Dev server
cd frontend
npm run dev

# Terminal 2: Build (optional)
npm run build
```

# 📝 Thêm Dữ Liệu Mới

## 1. Thêm phòng mới

File: `src/data/rooms.js`
```javascript
export const ROOMS = [
  {
    id: 1,
    name: 'Phòng Suite Sang Trọng',
    meta: '⭐ 4.9 (127 reviews)',
    price: '$289',
  },
  // Thêm ở đây
  {
    id: 4,
    name: 'Phòng mới',
    meta: '⭐ 4.8 (50 reviews)',
    price: '$199',
  },
]
```

## 2. Thêm tiện ích mới

File: `src/data/features.js`
```javascript
export const FEATURES = [
  // Existing...
  {
    id: 7,
    icon: '🏊',
    title: 'Bể Bơi Olympic',
    desc: 'Bể bơi tiêu chuẩn quốc tế'
  },
]
```

## 3. Thêm đánh giá mới

File: `src/data/reviews.js`
```javascript
export const REVIEWS = [
  // Existing...
  {
    id: 4,
    name: 'Người dùng mới',
    text: 'Đánh giá ở đây',
    rating: 5,
  },
]
```

# 🎨 Thêm Style Mới

File: `src/styles/Home.module.css`

```css
/* Thêm class mới */
.myNewClass {
  /* Styles */
}

/* Mobile responsive */
@media (max-width: 768px) {
  .myNewClass {
    /* Mobile styles */
  }
}
```

# ➕ Thêm Component Mới

1. Create file: `src/components/home/MySection.jsx`

```javascript
/**
 * MySection Component
 * Mô tả component
 */
import React from 'react'
import SectionContainer from './SectionContainer'
import styles from '../../styles/Home.module.css'

const MySection = ({ data }) => {
  return (
    <SectionContainer variant="light">
      <h2 className={styles.sectionTitle}>Tiêu Đề</h2>
      {/* Content */}
    </SectionContainer>
  )
}

export default MySection
```

2. Import in `Home.jsx`:

```javascript
import MySection from '../../components/home/MySection'

// In render:
<MySection data={myData} />
```

# 🔗 Import Cheatsheet

```javascript
// Từ data
import { ROOMS } from '../../data/rooms'
import { FEATURES } from '../../data/features'
import { REVIEWS } from '../../data/reviews'

// Từ components
import HeroSection from '../../components/home/HeroSection'
import RoomList from '../../components/home/RoomList'

// Từ styles
import styles from '../../styles/Home.module.css'
import '../../styles/global.css'
```

# 🐛 Debug Tips

1. **Check console errors**
   ```
   F12 → Console tab → Xem lỗi
   ```

2. **Inspect element**
   ```
   Right click → Inspect → xem styles applied
   ```

3. **Check HMR (Hot Module Reload)**
   ```
   npm run dev → xem console logs từ terminal
   ```

4. **Clear cache**
   ```
   Ctrl + Shift + Del → Clear browser cache
   Restart dev server
   ```

# 📱 Responsive Breakpoints

```css
/* Desktop (default) */
.roomsGrid { grid-template-columns: repeat(3, 1fr); }

/* Tablet */
@media (max-width: 1024px) {
  .roomsGrid { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 768px) {
  .roomsGrid { grid-template-columns: 1fr; }
}
```

# 🎯 Common Tasks

## Thay đổi màu

1. Tìm màu trong `Home.module.css`
2. Thay đổi hex value
3. Dev server tự reload (HMR)

## Thay đổi layout

1. Sửa `grid-template-columns` hoặc `flex` properties
2. Kiểm tra responsive breakpoints
3. Test trên mobile/tablet

## Thay đổi text

1. Sửa trong data files (data/*.js)
2. Hoặc sửa trực tiếp trong component JSX
3. Dev server reload ngay lập tức

## Thêm icon/emoji

```javascript
// Đơn giản - sử dụng emoji
icon: '🚀'

// Thay vì lucide-react (removed)
// import { Icon } from 'lucide-react'
```

# ✅ Checklist trước khi commit

- [ ] Chạy `npm run build` - build thành công?
- [ ] Không có console errors
- [ ] Responsive design OK (desktop/tablet/mobile)
- [ ] Vietnamese comments added
- [ ] Imports paths correct
- [ ] Component names PascalCase
- [ ] File names match component names
- [ ] Data separated từ components

# 📚 Component Dependencies

```
Home.jsx (main)
├── HeroSection
│   └── SearchBar
├── RoomList
│   ├── RoomCard (x3)
│   └── SectionContainer
├── FeaturesSection
│   ├── FeatureCard (x6)
│   └── SectionContainer
├── StatsSection
│   └── SectionContainer
├── ReviewsSection
│   ├── ReviewCard (carousel)
│   └── SectionContainer
└── CTASection
    └── SectionContainer
```

# 🔄 Props Flow

```
Home.jsx (has data)
  ↓
RoomList (receives ROOMS)
  ↓
RoomCard (receives room)
  ↓
(render room info)

Event callback:
RoomCard (onClick)
  ↓
RoomList (onRoomSelect)
  ↓
Home.jsx (handleRoomSelect)
```

# 🛠️ Useful Commands

```bash
# Start dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview

# View file structure
tree -L 3 -I 'node_modules|dist'
```

# 📞 FAQ

**Q: Component không hiển thị?**
A: Check:
- Có import vào Home.jsx không?
- Có export default không?
- Props passed đúng không?

**Q: Styles không apply?**
A: Check:
- CSS class tên đúng không?
- Import styles từ đúng file?
- Class name trong template đúng không?

**Q: HMR không auto-reload?**
A: 
- Restart dev server
- Check terminal có error không

**Q: Build fail?**
A:
- Xem error message
- Check import paths
- npx tsc --noEmit (check TypeScript)

---

**Happy coding! 🚀**

Tham khảo: [REFACTOR_DOCUMENTATION.md](./REFACTOR_DOCUMENTATION.md)
