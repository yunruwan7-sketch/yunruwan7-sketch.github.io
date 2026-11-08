# 万韵如 · 游戏策划作品集

游戏策划个人作品集，使用 GitHub Pages 发布。

网站地址：https://yunruwan7-sketch.github.io/

## 预览

在本目录运行 `python3 -m http.server 4173`，打开 `http://127.0.0.1:4173/`。

首页分为游戏项目、游戏拆解、AIGC 影像三个独立分区。同一游戏的介绍、试玩、策划案、美术和音频需求集中在同一个项目内。工位绿洲的试玩入口打开 itch.io 原项目；失序乐章封面二维码对应 TapTap PC Demo 作品页，试玩按钮已接入并注明客户端。《逃离女巫城堡》的首页与详情页均提供“立即试玩”，打开本站的 Godot 网页试玩页。其余未提供试玩链接的项目显示“试玩待补充”。

《小羊城堡逃脱》现显示为用户确认的新名称《逃离女巫城堡》，原策划案和攻略的文档名称保持原样。试玩入口为 [itch.io 作品页](https://manunyeo.itch.io/escape-witch-castle)，在电脑上用键盘游玩，游戏设置中可切换中文或英文；作品集不加载未经验证的跨站游戏 iframe。

## 真实材料

- `assets/work/sheep-castle-cover.png`：Godot 项目主界面使用的原始封面，未改写。
- `assets/work/sheep-castle-menu.png`、`sheep-castle-mirror-jump.png`、`sheep-castle-spatial-dash.png`：最新实际运行的中文主界面、重力倒转教学与空间冲刺截图。
- `assets/video/sheep-castle-jump-clip.mp4`：普通／镜中重力下的3秒跳跃操作片段，无音轨；页面明确标注片段性质，完整游戏通过上方网页版入口试玩。

- `assets/work/oasis-title.jpg`、`oasis-gameplay.jpg`：工位绿洲真实主界面、养成与天气合成界面截图。
- `assets/work/oasis-design-ui.jpg`：从原始设计 PDF 提取的嵌入插图，准确标为设计案界面。
- `assets/work/oasis-design-page*.png`：原始设计案页面。
- `assets/work/sanhuan-*.jpg`：用户飞书 42 页拆解中的原始演示页面。
- `assets/work/band-scoring-design.jpg`：少女乐队音游原始设计案的判定、Combo 与评价规则截图。
- `assets/work/aruna-final-poster.png`：用户提供的正式海报，原图未改写。竖版完整展示，点击可放大。
- `assets/work/aruna-final-*.jpg`：从最新影片提取的原帧，标注片中时间。
- `assets/video/aruna-final-film.mp4`：最新完整影片的网页播放版本，时长 5 分 13.30 秒，720p H.264/AAC，保留完整画幅与原声。
- `assets/video/oasis-demo.mp4`：用户提供的《工位绿洲》完整演示视频，时长 1 分 30.50 秒，1080p H.264/AAC，保留完整画幅、讲解与字幕；网页版本约 20.3 MB。
- `assets/work/oasis-demo-poster.jpg`：从上述演示视频第 30 秒提取的原帧，仅作为播放器封面。
- `assets/work/band-title-taptap.jpg`、`band-gameplay-taptap.jpg`、`band-defeat-taptap.jpg`：从《失序乐章》TapTap 作品图集取得的三张真实游戏画面，分别为主界面、战斗界面、失败结算；不是原美术需求中的界面稿。
- `assets/documents/aruna-creation-notes.pdf`：用户提供的创作说明原 PDF，未改写。
- `assets/documents/aruna-pages/`：完整 22 页创作说明的页面预览，用于站内连续阅读。原稿第 16、18 页也放入图集作为制作过程材料。
- `assets/resume.pdf`：原版简历，未改写；`resume-preview.png` 用于站内预览。

阿鲁纳项目的视频、海报与创作说明均已切换为本次用户直接提供的文件。旧影片和旧截图保存在工作目录的备份中，不进入本网站文件包。百度网盘链接保留为附加原文件入口。本次没有访问该网盘内容；站内影片直接来自用户提供的本地 MP4。

AIGC 分区直接展示原生影片播放器、完整海报与“创作说明”，默认不自动播放。点击播放后在原区域观看，保留原生进度、音量与全屏控制。“创作说明”打开可滚动的完整原页，同时保留原 PDF 入口。AIGC 不再使用游戏项目的资料目录与媒体标签。

## 拆解演示文稿

`assets/documents/sanhuan-system-analysis.pdf` 是从用户提供的飞书演示文稿通过原生“下载为 PDF”导出的完整 42 页。`assets/documents/sanhuan-pages/` 保存对应的 42 张 1920×1080 原页，保留原版式，按页码顺序供站内阅读器使用。

拆解页面直接进入独立翻页阅读器，可上一页、下一页、选择页码、用键盘翻页和全屏阅读；不再显示游戏项目的“资料目录／图片与视频”标签。首页“阅读拆解”与旧的拆解详情链接都会打开此阅读器。

## 更新内容

`profile.js` 保存个人资料、项目内容与材料地址；`homepage.js` / `homepage.css` 渲染三个首页分区；`slides-view.js` / `slides-view.css` 控制拆解翻页阅读；`film-view.js` / `film-view.css` 控制独立 AIGC 影片展示；`app.js` 控制不同作品类型的路由、游戏项目详情、文档预览、简历与联系面板。

`gallery` 每张填写 `src`、`alt`、`caption`、`type`；竖版海报设 `type: "poster"`。`reelUrl` 为视频，`videoPoster` 为视频封面。`documentUrl` 为原文档，`documentTitle` / `documentLabel` 定义阅读入口，`documentPages` 保存完整原页预览（可填写宽高避免加载时页面跳动）。`originalFileUrl` 为附加原文件入口。

`playUrl`、`sourceUrl`、`downloadUrl` 分别指向试玩、源码、下载。留空的链接不会生成入口。`category` 为 `game`、`analysis` 或 `aigc`，分别对应四个游戏项目、一份系统拆解与一部 AIGC 短片。

工位绿洲使用 itch.io 原项目链接：实测直接嵌入游戏文件会触发平台拦截。后续可接入本人导出的完整 Web 构建或平台提供的正式嵌入入口，验证后再展示。

## 部署准备

仓库 main 分支根目录包含完整静态页面与素材，通过 GitHub Pages 发布。更新页面或素材后提交并推送，Pages 会自动重新部署。

## 新增的 Game Jam 材料

目录现为六项作品。“少女乐队音游”更新为正式名《失序乐章》，并新增“技术宅拯救车厢”和“小羊城堡逃脱”。

- `assets/work/thunder-train-scene.png`：车厢项目共享美术资源中的场景原图，不是实机截图，也不表示策划本人绘制。
- `assets/work/thunder-clock-original.png`：车厢原案第 7 页的统一时钟原表。
- `assets/work/sheep-*-original.png`：从小羊策划案提取的完整关卡路线与流程原图，用于展示空间方案；不把图中旧时间写作实测结果。
- `assets/work/band-stage-original.webp`：音游共享美术目录的关卡界面原文件，经无损格式转换用于网页，不是实机截图。
- `assets/work/plan-pages/`：从用户最新飞书策划案导出件渲染的关键原页，音游避开标明旧版的流程图。

游戏策划文档保留飞书全文入口，不再展示原页节选。四个游戏的项目职责统一标为“主策”：工位绿洲另有部分 Vibe Coding 与音效生成，小羊另有部分 Vibe Coding，技术宅拯救车厢另有部分美术与音乐工作；没有为失序乐章额外增加编程或音效制作职责。实习经历、游戏拆解与 AIGC 的原有分工不变。

## 资料目录交互（当前版）

游戏默认进入“作品介绍”，顶部突出试玩入口。资料目录仅保留策划、程序、美术、音频等原始文档与文件夹链接，共 18 项；已移除拆分出的文档截图、局部关卡图、原页节选及“查看原图”操作。阅读策划案直接打开原文，不再以截图替代原文档。

工位绿洲的“图片与视频”已接入完整演示录屏和两张真实实机图，默认不自动播放；顶部“观看演示”可切换到播放器并播放，保留原生进度、音量与全屏控制。《失序乐章》已接入 TapTap 图集中的三张游戏画面，并标注约 1 分 3 秒的 TapTap 实机演示；观看按钮打开原作品页，在“实机画面”中播放，没有下载或伪装为本地视频。车厢目前仍保留截图和视频占位；《逃离女巫城堡》已接入中文主界面、镜中教学、空间冲刺三张真实运行截图，以及明确标为3秒无音轨操作片段的短视频。演示视频不加入资料目录。介绍封面独立于媒体内容：失序乐章使用用户最新上传的完整封面，《逃离女巫城堡》使用游戏项目自身的原始封面画面。拆解与 AIGC 继续使用各自的完整阅读和播放界面。离开媒体标签、切换作品或打开弹窗时，影片会暂停。

## 赛事名称与日期核对

- 工位绿洲：正式赛事为「翌光计划｜武汉全球高校游戏创作挑战赛」，武汉大学信息管理学院是线下站点之一，赛事期为 **2026.09.04—09.06**、48 小时。属于 Global Game Jam 中国合作赛事，不能写成一月常规 GGJ。来源：[GGJ 官方发布](https://globalgamejam.org/zh-hans/node/1993)、[官方会场页](https://globalgamejam.org/jam-sites/2026/yiguang-2026)。
- 失序乐章：2026 TapTap「聚光灯21天游戏创作挑战」，**10.01—10.21** 为赛事创作期，主题「涌现」；[作品页](https://www.taptap.cn/app/987871)显示 10.22 上线。作品制作期沿用本人简历的 2026.10—至今，赛事期单独标明。来源：[TapTap 官方公告](https://www.taptap.cn/moment/842437352541388887?group_id=792849)。
- 技术宅拯救车厢：本人明确提供 **2026 第十届 MAKERS 游戏开发大赛**。校方确认 MAKERS 为南京大学计算机学院相关赛事，网易官方报告确认与南京大学合作举办上一届；本届具体开赛月份未查到，因此只写 2026，不挪用旧届日期。来源：[南京大学官方通知](https://cs.nju.edu.cn/bf/09/c65918a835337/page.htm)、[网易 2025 ESG 报告第 29 页](https://ir.netease.com/static-files/91faf8ff-5c35-43db-8696-e1a25cfc1ec3)。
- 小羊城堡逃脱：原飞书父目录写作 **thatgamejam**，赛事由 thatgamecompany 主办。未找到本作品与 #01 或 #02 的明确对应，暂不填写届次与月份。来源：[赛事官方介绍](https://thatgamecompany.com/thatgamecompany-launches-thatgamejam-a-new-game-jam-focused-on-creativity-and-emotion/)。

`project.resources` 每项包括 `id`、`title`、`group`、`kind`、`url`，以及可选 `previewPages`、`previewImage`、`videoPoster`、`excerpt`。只有已取得地址的材料才生成入口；新增地址后刷新页面即可接入。

## 首页布局

四个游戏项目统一为桌面两列、手机单列的同等卡片。工位绿洲使用主界面封面，实际游戏截图放在项目的“图片与视频”；失序乐章保留本人提供的正式封面，车厢仍标明为场景美术素材，《逃离女巫城堡》使用主界面原始封面画面。游戏拆解使用报告原页，AIGC 影像独立展示完整竖版海报和影片画面。旧的全项目侧栏与配色比较界面已停用；原比较页地址会转到新版首页。

首页不再展示现职实习介绍与城市，卡片也不再重复列出策划案、美术需求等资料清单。工位绿洲、失序乐章、技术宅拯救车厢的开发引擎均为 Unity，小羊城堡逃脱为 Godot；首页卡片与详情读取同一字段。原版简历文件及履历中的真实实习经历保持原样。

## 站内网页试玩

《逃离女巫城堡》位于 `play/witch-castle/`，首页与项目详情的“立即试玩”直接打开该页。Web 游戏采用与已验证版本相同的引擎、素材和逻辑；仅把资源包拆为四个带内容指纹的文件，以符合 GitHub 文件大小限制，浏览器加载后无损重组。完整许可文本随游戏保留。重建适配使用游戏工程中的 `scripts/prepare_castle_github_pages.py`。itch.io 原版本仍可通过 https://manunyeo.itch.io/escape-witch-castle 访问。
