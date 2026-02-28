# Bozon Live Website

A premium, high-performance digital solutions agency website for bozon.dev. Built with React, Framer Motion (for animations), and Supabase.

## 🚀 Key Sections

- **Hero**: Futuristic animated entrance with brand-aligned visual effects.
- **About**: Card-based company overview.
- **Services**: Dynamic list of services pulled directly from Supabase.
- **Portfolio**: Detailed case studies with real-time data integration.
- **Blog**: High-fidelity reading experience for formatted articles.
- **Team**: Grid layout featuring team members with uploaded photos.
- **Contact**: Functional lead generation form that saves directly to Supabase.

## 🛠️ Connection Guide (Supabase)

The website is designed to work in tandem with the **Bozon Admin Panel**.

### 1. Requirements
Ensure you have already completed the setup steps in the **Admin Panel README**:
- Database tables created via SQL schema.
- `team` storage bucket created and set to **Public**.
- Authentication users created for admin access.

### 2. Connect the Code
- Open `src/App.jsx`.
- Replace `SUPABASE_URL` and `SUPABASE_KEY` at the top of the file with the same credentials used in the Admin Panel.

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## 🔗 Syncing Content
Any changes made in the **Admin Panel** will reflect on this website instantly upon save. If you are using **Live Preview** in the admin panel, the website will open in an iframe and receive temporary data via `postMessage` for real-time visualization.

## 📐 Project Structure

- `src/App.jsx`: Main application logic and section rendering.
- `public/`: Assets including the premium CSS Logo.
- `index.css`: Tailwind-free, performance-optimized CSS.
