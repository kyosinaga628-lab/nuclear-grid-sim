# Web公開（デプロイ）の手順

このアプリケーションをインターネット上で公開するための手順をまとめました。
すでにビルド（`npm run build`）は完了しており、`dist` フォルダに公開用のファイル一式が生成されています。

## 方法1: Netlify Drop (最も簡単・アカウント登録不要な場合あり)
**ファイルをドラッグ＆ドロップするだけで公開できます。**

1. エクスプローラーで、このプロジェクトのフォルダを開きます。
2. `dist` という名前のフォルダがあることを確認します。
3. ブラウザで [Netlify Drop](https://app.netlify.com/drop) にアクセスします。
4. `dist` フォルダを、ブラウザの「Drag and drop your site folder here」の枠内にドラッグ＆ドロップします。
5. 数秒でアップロードが完了し、公開URLが発行されます。

## 方法2: Vercel (推奨・GitHub連携)
**GitHubと連携し、継続的な更新（CI/CD）を行いたい場合に最適です。**

1. このプロジェクトを GitHub のリポジトリにプッシュします。
2. [Vercel](https://vercel.com/) のアカウントを作成・ログインします。
3. "Add New..." -> "Project" をクリックし、GitHubリポジトリを選択します。
4. Framework Preset は自動的に `Vite` が選択されるはずです。
5. "Deploy" をクリックすると、自動的にビルドと公開が行われます。

## 方法3: GitHub Pages
**GitHubだけで完結させたい場合。**

1. `vite.config.ts` を開き、`base` 設定を追加します。
   ```typescript
   export default defineConfig({
     base: '/repository-name/', // リポジトリ名に合わせて変更
     plugins: [react()],
   })
   ```
2. GitHubリポジトリにプッシュします。
3. GitHubのリポジトリ設定（Settings）> Pages で、Sourceを `GitHub Actions` または `deploy from a branch` に設定して公開します。
   *(注意: ルーティング設定など、SPA特有の追加設定が必要になる場合があります)*

-----

**推奨**: 手軽に試すなら **方法1 (Netlify Drop)**、本格的に運用するなら **方法2 (Vercel)** がおすすめです。
このプロジェクトは静的なHTML/CSS/JSとしてビルドされているため（Static Site）、特別なサーバー機能は不要で、ほぼすべてのホスティングサービスで動作します。
