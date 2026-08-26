# 字体目录 (PDF 中文防乱码)

导出学生学情 PDF 使用 `pdfmake`，需要中文字体（思源黑体 / Source Han Sans SC）。

## 已内置字体
`NotoSansCJKsc-Regular.otf`（思源黑体简体中文版，已于仓库提供，约 16MB）。
导出接口 `src/controllers/export.js` 会自动读取并注册为 `han` 字体，杜绝中文方框乱码。

## 如需替换
可放入以下任一文件覆盖：
- `NotoSansCJKsc-Regular.otf`（优先）
- `SourceHanSansSC-Regular.ttf`（备选）

> 若两个文件都不存在，导出接口会返回 404 提示先放置字体文件。
> 字体文件为开源字体，可自由分发。
