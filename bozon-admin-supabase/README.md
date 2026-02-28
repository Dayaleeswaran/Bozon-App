# Bozon Admin Panel (Supabase)

A premium, custom-built admin console for managing the bozon.dev website. Built with React and Supabase.

## 🚀 Features

- **Dashboard**: Real-time stats and site overview.
- **Content Management**: Full CRUD for Services, Portfolio, and Blog Posts.
- **Team Management**: Manage team members with direct image uploads.
- **Rich Text Editor**: Formatted content editing using React-Quill.
- **Live Preview**: See how your changes look on the live site before saving.
- **Audit Logs**: Every admin action is tracked and logged.
- **Premium UI**: Sleek dark-mode interface with smooth animations and professional typography.

## 🛠️ Supabase Setup Guide

Follow these steps to connect your admin panel to Supabase:

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com/) and create a new project.
- Once created, go to **Project Settings > API** to get your **Project URL** and **Anon Key**.

### 2. Configure Authentication
- In the Supabase Dashboard, go to **Authentication > Users**.
- Add at least one user (your admin account) so you can sign in to the panel.

### 3. Run the Database Schema
- Copy the entire SQL block found at the top of `src/App.jsx` (under `SCHEMA_SQL`).
- In the Supabase Dashboard, go to **SQL Editor**.
- Click **New Query**, paste the SQL, and click **Run**.
- This creates all necessary tables (`services`, `portfolio`, `blog_posts`, `team_members`, `contact_submissions`, `audit_logs`) and their RLS policies.

### 4. Setup Storage for Images
- Go to **Storage** in the Supabase Dashboard.
- Create a new bucket named **`team`**.
- **Crucial**: Make the bucket **Public** so the website can display the uploaded images.
- Create a folder named `uploads` inside the bucket (optional, the app will create it on the fly).

### 5. Connect the Code
- Open `src/App.jsx`.
- Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of the file with your project's values.

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5174` in your browser.

## 📐 Project Structure

- `src/App.jsx`: The main application code (Single-file architecture for ease of maintenance).
- `public/`: Static assets including the official logo.
- `index.css`: Global baseline styles.
