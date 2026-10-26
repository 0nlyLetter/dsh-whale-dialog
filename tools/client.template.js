window.__ModuleLoader__.load({
  id: '@local/dsh-whale-dialog',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const VIEW_ID = 'whale-dialog'
    // Leave empty to make the view available in every conversation.
    // Set a session id to restrict the visual-novel view to that one conversation.
    const TARGET_SESSION = ''
    const CHARACTER_OWNER = TARGET_SESSION === '' ? 'default' : TARGET_SESSION
    const CONVERSATION_KEY = 'dsh.conversation'
    const LOCAL_PREFIX = 'dsh.whale-dialog'
    const DEFAULT_NAME = 'deepseek'
    const DEFAULT_PORTRAIT = '__PORTRAIT_DATA_URL__'
    const SPEAKING_PORTRAIT = '__SPEAKING_DATA_URL__'
    const THINKING_PORTRAIT = '__THINKING_DATA_URL__'
    const HAPPY_PORTRAIT = '__HAPPY_DATA_URL__'
    const SAD_PORTRAIT = '__SAD_DATA_URL__'
    const SETTINGS_KEY = 'dsh.whale-dialog.settings'
    const DEFAULT_SETTINGS = { portraitSide: 'right', frameWidth: 1010, fontSize: 17, sound: true }
    const TYPE_INTERVAL_MS = 26
    const WHALE_PATH = 'M8 44c0-14 12.4-25 28-25 11.4 0 21.1 5.4 25.9 13.4l11.4-8c1.6-1.1 3.7.3 3.4 2.2l-1.9 12.1 8.6 4.3c1.7.8 1.7 3.3 0 4.1l-8.6 4.3 1.9 12.1c.3 1.9-1.8 3.3-3.4 2.2l-11.4-8C57.1 64.6 47.4 70 36 70 20.4 70 8 59 8 44Z'
    const EMPTY_CHAT = { key: '', text: '', status: 'none', lastUserSeq: -1, lastUserText: '', turn: undefined, step: undefined }

    const CSS = `
.wd-stage{--wd-navy:#12295a;--wd-deep:#0a1735;--wd-blue:#2f66d0;position:relative;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;width:100%;height:calc(var(--dsh-conversation-viewport-height,100dvh) - var(--dsh-composer-height,152px) - 10px);min-height:min(420px,calc(100dvh - 240px));padding:20px clamp(14px,3.4vw,46px) 26px;overflow:hidden;color:#e8f1ff;background:linear-gradient(180deg,#0b2a52 0%,#061426 100%);font-family:var(--ds-font-family-default,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif);isolation:isolate}
.wd-scene{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
.wd-stage::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(3,12,28,.52) 0%,rgba(3,12,28,0) 18%),linear-gradient(0deg,rgba(3,10,22,.5) 0%,rgba(3,10,22,0) 26%)}
.wd-rays{animation:wd-rays 9s ease-in-out infinite alternate}
.wd-swimA{animation:wd-swimA 38s ease-in-out infinite alternate}
.wd-swimB{animation:wd-swimB 50s ease-in-out infinite alternate}
.wd-fish{animation:wd-fish 26s ease-in-out infinite alternate}
.wd-stage::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.4px),radial-gradient(rgba(140,190,255,.12) 1px,transparent 1.4px);background-size:64px 64px,96px 96px;background-position:0 0,22px 34px;opacity:.35;z-index:0}
.wd-whale{position:absolute;right:-4%;top:-6%;width:min(46%,520px);color:#cfe4ff;opacity:.09;pointer-events:none;z-index:0;transform:rotate(-6deg)}
.wd-hud{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:rgba(214,232,255,.75)}
.wd-brand{display:inline-flex;align-items:center;gap:9px;font-weight:600}
.wd-brandDot{width:9px;height:9px;border-radius:50%;background:linear-gradient(180deg,#9fd0ff,#3f80e8);box-shadow:0 0 12px rgba(126,190,255,.9)}
.wd-state{display:inline-flex;align-items:center;gap:7px;letter-spacing:.1em;color:rgba(200,224,255,.7)}
.wd-stateDot{width:7px;height:7px;border-radius:50%;background:#7d93b8;box-shadow:0 0 0 3px rgba(125,147,184,.14)}
.wd-stateDot.is-live{background:#63ffd0;box-shadow:0 0 10px rgba(99,255,208,.8);animation:wd-pulse 1.6s ease-in-out infinite}
.wd-hudRight{display:flex;align-items:center;gap:12px}
.wd-settingsBtn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border-radius:50%;border:1px solid rgba(207,226,255,.4);background:rgba(10,28,66,.45);color:#cfe4ff;cursor:pointer;transition:background .15s,color .15s}
.wd-settingsBtn:hover{background:rgba(36,74,140,.7);color:#ffffff}
.wd-setOverlay{position:absolute;inset:0;z-index:8;background:rgba(3,10,28,.38)}
.wd-setCard{position:absolute;z-index:9;top:52px;right:clamp(14px,3.4vw,46px);width:min(380px,calc(100% - 28px));max-height:calc(100% - 76px);overflow:auto;padding:14px 16px 10px;border-radius:18px;border:2px solid #1b3d8f;background:linear-gradient(180deg,#ffffff,#eaf3ff);color:#12295a;box-shadow:0 24px 60px rgba(2,8,24,.6),0 0 0 4px rgba(207,226,255,.35);outline:none}
.wd-setHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;border-bottom:1px solid #d5e5fb}
.wd-setTitle{font-size:14px;font-weight:700;letter-spacing:.06em}
.wd-setClose{width:26px;height:26px;padding:0;border:0;border-radius:50%;background:transparent;color:#5b7cb5;font-size:18px;line-height:1;cursor:pointer}
.wd-setClose:hover{background:#eaf3ff;color:#12295a}
.wdpopBody{display:flex;flex-direction:column}
.wdpopRow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:.5px solid #dbe8fb}
.wdpopRow:last-child{border-bottom:none}
.wdpopText{flex:1 1 auto;min-width:0}
.wdpopLabel{font-size:13px;line-height:18px;color:#12295a}
.wdpopDesc{font-size:11px;line-height:16px;color:#5b7196;margin-top:2px}
.wdpopControl{flex:none;display:flex;align-items:center;gap:8px}
.wdpopSeg{display:inline-flex;border:1px solid #c6d9f5;border-radius:8px;overflow:hidden}
.wdpopSegBtn{border:0;background:transparent;color:#5b7196;font:inherit;font-size:12px;padding:5px 12px;cursor:pointer}
.wdpopSegBtn:hover{background:#eaf3ff}
.wdpopSegBtn[data-active="true"]{background:#2f66d0;color:#ffffff}
.wdpopRange{width:118px;accent-color:#2f66d0}
.wdpopSwitch{position:relative;width:38px;height:21px;padding:0;border:0;border-radius:999px;background:#c6d9f5;cursor:pointer;transition:background .15s}
.wdpopSwitch[aria-checked="true"]{background:#2f66d0}
.wdpopSwitch::after{content:"";position:absolute;top:3px;left:3px;width:15px;height:15px;border-radius:50%;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .15s}
.wdpopSwitch[aria-checked="true"]::after{transform:translateX(17px)}
.wdpopReset{border:1px solid #c6d9f5;border-radius:8px;background:transparent;color:#5b7196;font:inherit;font-size:12px;padding:5px 12px;cursor:pointer}
.wdpopReset:hover{background:#eaf3ff;color:#12295a}
.wdpopEdit{border:1px solid #c6d9f5;border-radius:8px;background:transparent;color:#2f66d0;font:inherit;font-size:12px;padding:5px 12px;cursor:pointer}
.wdpopEdit:hover{background:#eaf3ff}
.wd-charOverlay{position:absolute;inset:0;z-index:10;background:rgba(3,10,28,.5)}
.wd-charCard{position:absolute;z-index:11;top:50%;left:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 28px));max-height:calc(100% - 48px);overflow:auto;padding:14px 16px;border-radius:18px;border:2px solid #1b3d8f;background:linear-gradient(180deg,#ffffff,#eaf3ff);color:#12295a;box-shadow:0 24px 60px rgba(2,8,24,.65),0 0 0 4px rgba(207,226,255,.35);outline:none}
.wd-panelWrap{position:relative;z-index:2;width:100%;max-width:1010px;margin:0 auto;display:flex;flex-direction:column;gap:9px}
.wd-panel{position:relative;padding:clamp(12px,1.5vw,16px);border-radius:30px;background:linear-gradient(120deg,rgba(255,255,255,.34) 0%,rgba(255,255,255,.06) 26%,rgba(255,255,255,0) 46%),linear-gradient(180deg,#4d8aee 0%,#2d64c9 44%,#173a86 100%);box-shadow:0 0 0 2px #0a1f4b,0 0 0 4px rgba(207,226,255,.92),0 0 0 5px #0a1f4b,0 28px 64px rgba(2,9,28,.65),inset 0 2px 0 rgba(255,255,255,.55),inset 0 -12px 26px rgba(4,14,44,.45);animation:wd-box-in .45s cubic-bezier(.2,.85,.3,1) both}
.wd-panel::before{content:"";position:absolute;inset:6px;border-radius:24px;border:1px solid rgba(226,240,255,.45);box-shadow:inset 0 0 18px rgba(8,24,64,.35);pointer-events:none}
.wd-panelBody{position:relative;display:flex;gap:clamp(14px,2.2vw,26px);align-items:stretch;padding:clamp(16px,2vw,26px) clamp(16px,2.2vw,28px);min-height:206px;border-radius:18px;border:1px solid #2f5fb8;background:radial-gradient(130% 90% at 18% 0%,rgba(255,255,255,.96),rgba(255,255,255,0) 58%),repeating-linear-gradient(0deg,rgba(120,160,230,.05) 0 1px,transparent 1px 22px),linear-gradient(180deg,#ffffff 0%,#f3f8ff 56%,#e7f1ff 100%);box-shadow:inset 0 0 0 3px #ffffff,inset 0 0 0 5px #b9d4fb,inset 0 12px 28px rgba(90,140,220,.12),inset 0 -16px 34px rgba(90,140,220,.10);overflow:hidden;isolation:isolate}
.wd-bow{position:absolute;top:-24px;left:50%;width:62px;height:44px;transform:translateX(-50%);z-index:5;filter:drop-shadow(0 6px 10px rgba(3,12,34,.45));pointer-events:none}
.wd-lace{position:absolute;top:3px;left:18px;right:18px;height:10px;z-index:4;pointer-events:none;background:radial-gradient(circle at 8px 0,#ffffff 7.4px,rgba(255,255,255,0) 8px) repeat-x;background-size:16px 10px;opacity:.92;filter:drop-shadow(0 1px 1px rgba(6,16,44,.45))}
.wd-bubbles{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.wd-bubbles i{position:absolute;bottom:-24px;border-radius:50%;border:1px solid rgba(207,230,255,.45);background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.55),rgba(150,200,255,.10));opacity:0;animation:wd-rise 16s linear infinite}
.wd-bubbles i:nth-child(1){left:7%;width:13px;height:13px;animation-duration:19s;animation-delay:-3s}
.wd-bubbles i:nth-child(2){left:18%;width:7px;height:7px;animation-duration:14s;animation-delay:-8s}
.wd-bubbles i:nth-child(3){left:34%;width:18px;height:18px;animation-duration:24s;animation-delay:-12s}
.wd-bubbles i:nth-child(4){left:62%;width:9px;height:9px;animation-duration:16s;animation-delay:-6s}
.wd-bubbles i:nth-child(5){left:78%;width:15px;height:15px;animation-duration:21s;animation-delay:-15s}
.wd-bubbles i:nth-child(6){left:89%;width:6px;height:6px;animation-duration:13s;animation-delay:-10s}
.wd-rivet{position:absolute;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#ffffff 0%,#cfe4ff 40%,#5a94ee 68%,#1b3d8f 100%);box-shadow:0 0 0 1px #0a1f4b;pointer-events:none;z-index:4}
.wd-rivet-tl{top:6px;left:6px}
.wd-rivet-tr{top:6px;right:6px}
.wd-rivet-bl{bottom:6px;left:6px}
.wd-rivet-br{bottom:6px;right:6px}
.wd-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:8px;padding:2px 2px 2px 6px;order:1;position:relative;z-index:1}
.wd-skip{position:absolute;right:0;bottom:-4px;padding:2px 9px;border-radius:999px;background:rgba(47,102,208,.08);color:#5b7cb5;font-size:11px;letter-spacing:.06em;pointer-events:none}
.wd-rich{max-height:min(28vh,260px);overflow:auto;padding-right:8px;color:var(--wd-navy);font-size:var(--wd-font-size,clamp(15px,1.32vw,18px));line-height:1.95;letter-spacing:.01em;scrollbar-width:thin;scrollbar-color:#9cc0ff rgba(47,102,208,.08);word-break:break-word}
.wd-paperWhale{display:block;position:absolute;left:8px;bottom:-2px;width:112px;color:#2f66d0;opacity:.06;pointer-events:none;z-index:0}
.wd-rich::-webkit-scrollbar{width:8px}
.wd-rich::-webkit-scrollbar-thumb{background:#b7d1f8;border-radius:8px}
.wd-rich p{margin:0 0 .72em}
.wd-rich p:last-child{margin-bottom:0}
.wd-rich strong{color:#0b3ea8;font-weight:700}
.wd-rich em{color:#2a4d91}
.wd-rich code{font-family:var(--ds-font-family-code,"Cascadia Code",Consolas,monospace);font-size:.88em;color:#0b3ea8;background:#d8e8ff;border-radius:6px;padding:1px 6px}
.wd-rich pre{margin:.2em 0 .8em;padding:12px 15px;border-radius:12px;background:#0d2147;border:1px solid #2b539f;color:#dbe9ff;overflow:auto;font-size:.85em;line-height:1.65}
.wd-rich pre code{background:none;color:inherit;padding:0}
.wd-rich ul,.wd-rich ol{margin:.15em 0 .8em;padding-left:1.35em}
.wd-rich li{margin:.18em 0}
.wd-rich blockquote{margin:.15em 0 .8em;padding:.1em 0 .1em 12px;border-left:3px solid #8fb8ff;color:#3d5c94}
.wd-rich h5{margin:.2em 0 .5em;color:#0b3ea8;font-size:1.02em}
.wd-rich[data-streaming="true"] p:last-child::after{content:"▍";margin-left:3px;color:#2f66d0;animation:wd-blink 1s steps(1,end) infinite}
.wd-thinking{display:inline-flex;align-items:center;gap:10px;color:#4b6795;font-size:calc(var(--wd-font-size,17px) - 2px);letter-spacing:.04em}
.wd-dots{display:inline-flex;gap:5px}
.wd-dots i{width:6px;height:6px;border-radius:50%;background:#5b8fe0;animation:wd-dot 1.2s infinite ease-in-out}
.wd-dots i:nth-child(2){animation-delay:.15s}
.wd-dots i:nth-child(3){animation-delay:.3s}
.wd-greeting{color:#2f4e86;font-size:var(--wd-font-size,clamp(15px,1.3vw,18px));line-height:1.9}
.wd-side{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;min-width:clamp(120px,13vw,178px);order:2;position:relative;z-index:1}
.wd-panelBody--left .wd-text{order:2}
.wd-panelBody--left .wd-side{order:1}
.wd-frameWrap{position:relative;padding:6px;border-radius:20px;background:linear-gradient(180deg,#4d8aee 0%,#2453b0 55%,#173a86 100%);box-shadow:0 0 0 2px #0a1f4b,0 0 0 3px rgba(207,226,255,.85),0 12px 26px rgba(3,12,34,.42),inset 0 1px 0 rgba(255,255,255,.45)}
.wd-frame{position:relative;display:block;width:clamp(112px,12.4vw,168px);aspect-ratio:1/1;padding:0;border:3px solid #ffffff;border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#f7fbff,#dbe9ff);box-shadow:inset 0 0 0 2px #cfe2ff;cursor:default}
.wd-portraitStack{position:absolute;inset:0;background:linear-gradient(180deg,#f7fbff,#dbe9ff)}
.wd-portrait{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .28s ease,transform .28s ease}
.wd-portrait.is-active{opacity:1}
.wd-portraitStack[data-mode="speaking"] .wd-portrait.is-active{animation:wd-talk .9s ease-in-out infinite}
.wd-portraitStack[data-mode="thinking"] .wd-portrait.is-active{animation:wd-breathe 3.2s ease-in-out infinite}
.wd-portraitStack[data-mode="happy"] .wd-portrait.is-active{animation:wd-happy 1.5s ease-in-out infinite}
.wd-portraitStack[data-mode="sad"] .wd-portrait.is-active{animation:wd-sad 3.4s ease-in-out infinite}
.wd-name{position:relative;max-width:100%;min-width:clamp(112px,12vw,164px);padding:8px 18px;border-radius:11px;border:2px solid #0a1f4b;background:linear-gradient(180deg,#5f9bf2 0%,#2f66d0 52%,#2453b0 100%);color:#ffffff;font-family:inherit;font-weight:700;font-size:clamp(13px,1.05vw,15px);letter-spacing:.16em;text-align:center;cursor:default;box-shadow:0 0 0 2px rgba(207,226,255,.9),0 8px 18px rgba(3,12,34,.42),inset 0 1px 0 rgba(255,255,255,.55),inset 0 -5px 10px rgba(9,26,70,.35)}
.wd-tip{align-self:flex-end;color:rgba(214,232,255,.62);font-size:11px;letter-spacing:.08em;padding-right:4px}
.wd-inputBar{position:relative;display:flex;align-items:flex-end;gap:10px;width:100%;max-width:100%;margin:8px auto 0;padding:8px 8px 8px 16px;border-radius:16px;border:2px solid #1b3d8f;background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(226,239,255,.97));box-shadow:0 12px 28px rgba(2,9,26,.4),0 0 0 3px rgba(207,226,255,.28),inset 0 0 0 1px #ffffff}
.wd-inputMain{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.wd-inputTools{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.wd-tool{display:inline-flex;align-items:center;justify-content:center;height:22px;max-width:150px;padding:0 7px;border-radius:7px;border:1px solid rgba(47,95,184,.28);background:rgba(255,255,255,.6);color:#3b5f9e;font-family:inherit;font-size:11px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.wd-tool:hover{background:#eaf3ff;color:#1b3d8f}
.wd-tool:disabled{opacity:.5;cursor:default}
.wd-attachInput{display:none}
.wd-attachList{display:flex;flex-wrap:wrap;gap:4px;padding-top:2px}
.wd-chip{display:inline-flex;align-items:center;gap:4px;max-width:180px;padding:2px 6px;border-radius:6px;background:#eaf3ff;border:1px solid #c6d9f5;color:#3b5f9e;font-size:11px;line-height:14px}
.wd-chip>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wd-chip>button{border:0;background:transparent;color:#5b7cb5;font:inherit;font-size:12px;line-height:1;padding:0 1px;cursor:pointer}
.wd-chip[data-status="pending"]{opacity:.65}
.wd-chip[data-status="error"]{background:#fff0f0;border-color:#e8b4b4;color:#a33}
.wd-menu{position:absolute;z-index:12;left:0;bottom:calc(100% + 8px);width:min(360px,calc(100vw - 48px));max-height:min(340px,60vh);overflow:auto;padding:6px;border-radius:12px;border:1px solid #2f5fb8;background:linear-gradient(180deg,#ffffff,#eaf3ff);box-shadow:0 18px 40px rgba(2,8,24,.42);color:#12295a}
.wd-menuTitle{padding:6px 8px 3px;color:#5b7196;font-size:11px;line-height:16px;letter-spacing:.05em}
.wd-menuItem{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:7px 9px;border:0;border-radius:8px;background:transparent;color:#12295a;font-family:inherit;font-size:12px;line-height:18px;text-align:left;cursor:pointer}
.wd-menuItem:hover{background:#e3efff}
.wd-menuItem[data-active="true"]{background:#dceaff;font-weight:600}
.wd-menuCheck{color:#2f66d0;flex:none}
.wd-menuEmpty{padding:8px;color:#5b7196;font-size:12px;line-height:18px}
.wd-menuWarn{margin-top:6px;padding:8px;border-radius:8px;background:#fff4e6;border:1px solid #f0c48a;color:#8a4b00;font-size:11px;line-height:16px}
.wd-menuActions{display:flex;gap:6px;margin-top:6px}
.wd-menuBtn{border:1px solid #8a4b00;border-radius:7px;background:#b5701a;color:#ffffff;font-family:inherit;font-size:11px;padding:5px 10px;cursor:pointer}
.wd-menuBtnGhost{border:1px solid #d8b98a;border-radius:7px;background:transparent;color:#8a4b00;font-family:inherit;font-size:11px;padding:5px 10px;cursor:pointer}
.wd-effortMenu{width:min(280px,calc(100vw - 48px));padding:10px 12px 12px}
.wd-effortHead{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;line-height:18px}
.wd-effortTitle{color:#12295a;font-weight:600}
.wd-effortValue{color:#2f66d0;font-size:11px;font-weight:500}
.wd-effortSlider{position:relative;height:26px;margin:6px 0 0;cursor:pointer;touch-action:none;user-select:none;outline:none}
.wd-effortSlider:focus-visible{box-shadow:0 0 0 2px rgba(47,102,208,.28);border-radius:8px}
.wd-effortRail{position:absolute;left:10px;right:10px;top:10px;height:6px;border-radius:3px;background:#dbe7f8;pointer-events:none}
.wd-effortFill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#2f66d0,#6fa3ef);transition:width .24s cubic-bezier(.22,1,.36,1);pointer-events:none}
.wd-effortKnob{position:absolute;top:50%;width:14px;height:14px;transform:translate(-50%,-50%);border-radius:50%;background:#ffffff;border:3px solid #2f66d0;box-shadow:0 2px 6px rgba(20,50,120,.35);transition:left .24s cubic-bezier(.22,1,.36,1);pointer-events:none}
.wd-effortSlider[data-dragging="true"] .wd-effortFill,.wd-effortSlider[data-dragging="true"] .wd-effortKnob{transition:none}
.wd-effortTicks{display:flex;justify-content:space-between;gap:4px;margin-top:2px}
.wd-effortTick{border:0;background:transparent;color:#6b7f9e;font-family:inherit;font-size:10px;line-height:14px;padding:2px 3px;cursor:pointer;white-space:nowrap}
.wd-effortTick[data-active="true"]{color:#1b3d8f;font-weight:600}
.wd-effortTick:hover{color:#2f66d0}
.wd-input{flex:1 1 auto;min-width:0;min-height:24px;max-height:96px;resize:none;border:0;outline:none;background:transparent;color:#12295a;font-family:inherit;font-size:15px;line-height:1.6;padding:6px 0;field-sizing:content}
.wd-input::placeholder{color:#8298bb}
.wd-input:disabled{opacity:.6;cursor:not-allowed}
.wd-send{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;min-width:76px;padding:0 16px;border-radius:12px;border:2px solid #0a1f4b;background:linear-gradient(180deg,#5f9bf2 0%,#2f66d0 58%,#2453b0 100%);color:#ffffff;font-family:inherit;font-weight:700;font-size:14px;letter-spacing:.12em;cursor:pointer;box-shadow:0 0 0 2px rgba(207,226,255,.85),0 6px 14px rgba(3,12,30,.35),inset 0 1px 0 rgba(255,255,255,.5);transition:filter .15s ease}
.wd-sendIcon{width:15px;height:15px;flex:none}
.wd-send:hover:not(:disabled){filter:brightness(1.08)}
.wd-send:disabled{opacity:.45;cursor:default;filter:none}
.wd-notice{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:3;padding:7px 16px;border-radius:999px;background:rgba(10,27,66,.92);border:1px solid rgba(140,190,255,.5);color:#dcebff;font-size:12px;letter-spacing:.04em;box-shadow:0 10px 24px rgba(2,8,24,.5)}
.wd-stageForeign{align-items:center;justify-content:center}
.wd-foreignCard{position:relative;z-index:2;max-width:440px;padding:26px 28px;border-radius:18px;background:linear-gradient(180deg,#ffffff,#e7f1ff);border:3px solid #1b3d8f;box-shadow:0 20px 50px rgba(2,9,28,.55);text-align:center;color:#12295a}
.wd-foreignTitle{font-weight:700;font-size:16px;margin-bottom:8px}
.wd-foreignText{font-size:13px;line-height:1.8;color:#3d5c94;margin:0 0 16px}
.wd-foreignBtn{padding:8px 20px;border-radius:9px;border:2px solid #12327a;background:linear-gradient(180deg,#4a86e8,#2b60c6);color:#fff;font-weight:600;cursor:pointer;font-family:inherit}
@keyframes wd-box-in{from{opacity:0;transform:translateY(16px) scale(.988)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes wd-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes wd-dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}
@keyframes wd-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes wd-talk{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.012)}}
@keyframes wd-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.008)}}
@keyframes wd-happy{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.012)}}
@keyframes wd-sad{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(2px) scale(.995)}}
@keyframes wd-rise{0%{transform:translateY(0);opacity:0}12%{opacity:.55}85%{opacity:.35}100%{transform:translateY(-72vh);opacity:0}}
@keyframes wd-rays{from{opacity:.07}to{opacity:.14}}
@keyframes wd-swimA{from{translate:-16px 6px}to{translate:28px -8px}}
@keyframes wd-swimB{from{translate:20px -4px}to{translate:-24px 8px}}
@keyframes wd-fish{from{translate:0 0}to{translate:52px -10px}}
@media (prefers-reduced-motion:reduce){.wd-panel{animation:none}.wd-stateDot.is-live{animation:none}.wd-dots i{animation:none}.wd-rich[data-streaming="true"] p:last-child::after{animation:none}.wd-portrait{transition:none;animation:none!important}.wd-bubbles{display:none}.wd-rays,.wd-swimA,.wd-swimB,.wd-fish{animation:none}}
@media (max-width:720px){.wd-stage{padding:14px 12px 18px;height:calc(var(--dsh-conversation-viewport-height,100dvh) - var(--dsh-composer-height,152px) - 6px)}.wd-panel{padding:9px;border-radius:24px}.wd-panelBody{flex-direction:column;gap:14px;padding:16px;border-radius:15px}.wd-side{flex-direction:row;align-items:flex-end;justify-content:flex-end;gap:12px;min-width:0}.wd-frame{width:100px;border-radius:12px}.wd-name{min-width:104px;padding:7px 12px}.wd-tip{display:none}.wd-rich{max-height:24vh}.wd-bow{top:-20px;width:52px;height:37px}.wd-lace{left:12px;right:12px}.wd-inputBar{margin-top:6px;padding:7px 7px 7px 12px;border-radius:13px}.wd-input{font-size:14px}.wd-tool{max-width:104px;padding:0 6px;font-size:10px}.wd-menu{width:calc(100vw - 40px)}.wd-send{height:34px;min-width:64px;padding:0 12px;font-size:13px}.wd-setCard{top:46px;right:12px;width:calc(100% - 24px);max-height:calc(100% - 58px)}}
`

    const SETTINGS_CSS = `
.wdgs{display:flex;flex-direction:column;width:100%}
.wdgsIntro{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin:0 0 4px}
.wdgsSection{display:flex;flex-direction:column;gap:10px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.wdgsRow{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.wdgsRow:last-child{border-bottom:none}
.wdgsLabel{color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.wdgsDesc{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}
.wdgsControl{flex:none;display:flex;align-items:center;gap:10px}
.wdgsSeg{display:inline-flex;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;overflow:hidden}
.wdgsSegBtn{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:18px;padding:6px 14px;cursor:pointer;transition:background .12s,color .12s}
.wdgsSegBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.wdgsSegBtn[data-active="true"]{background:var(--dsw-alias-brand-primary);color:#ffffff}
.wdgsRange{width:180px;accent-color:var(--dsw-alias-brand-primary)}
.wdgsValue{min-width:56px;text-align:right;color:var(--dsw-alias-label-secondary);font-size:12px;font-variant-numeric:tabular-nums}
.wdgsSwitch{position:relative;width:40px;height:22px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-border-l2);cursor:pointer;transition:background .15s}
.wdgsSwitch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}
.wdgsSwitch::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
.wdgsSwitch[aria-checked="true"]::after{transform:translateX(18px)}
.wdgsReset{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;padding:6px 14px;cursor:pointer}
.wdgsReset:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
@media (max-width:600px){.wdgsRow{align-items:flex-start;flex-direction:column;gap:10px}.wdgsRange{width:100%}}
`

    const CHARACTER_CSS = `
.wdCharEditor{display:flex;flex-direction:column;gap:12px}
.wdCharBlock{display:flex;flex-direction:column;gap:6px}
.wdCharLabel{font-size:13px;line-height:18px;color:#12295a;font-weight:600}
.wdCharHint{font-size:11px;line-height:16px;color:#5b7196}
.wdCharNameRow{display:flex;align-items:center;gap:8px}
.wdCharInput{flex:1 1 auto;min-width:0;padding:7px 10px;border-radius:8px;border:1px solid #c6d9f5;background:#ffffff;color:#12295a;font-family:inherit;font-size:13px;outline:none}
.wdCharInput:focus{border-color:#4a86e8;box-shadow:0 0 0 3px rgba(74,134,232,.18)}
.wdCharBtn{border:1px solid #12327a;border-radius:8px;background:linear-gradient(180deg,#4a86e8,#2b60c6);color:#ffffff;font-family:inherit;font-size:12px;padding:6px 12px;cursor:pointer}
.wdCharBtn:hover{filter:brightness(1.06)}
.wdCharBtn:disabled{opacity:.5;cursor:default}
.wdCharBtnGhost{border:1px solid #c6d9f5;border-radius:8px;background:transparent;color:#5b7196;font-family:inherit;font-size:12px;padding:6px 12px;cursor:pointer}
.wdCharBtnGhost:hover{background:#eaf3ff;color:#12295a}
.wdCharPortraitRow{display:flex;align-items:center;gap:12px}
.wdCharThumb{width:64px;height:64px;border-radius:10px;overflow:hidden;border:2px solid #ffffff;box-shadow:0 0 0 2px #1b3d8f;background:#eaf3ff;flex:none}
.wdCharThumb img{width:100%;height:100%;object-fit:cover;display:block}
.wdCharActions{display:flex;flex-wrap:wrap;gap:8px}
.wdCharPreview{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:12px;background:#f2f8ff;border:1px solid #c6d9f5}
.wdCharPreviewLabel{font-size:11px;line-height:16px;color:#5b7196;letter-spacing:.04em}
.wdCharPreviewImage{width:160px;height:160px;object-fit:cover;border-radius:12px;border:3px solid #ffffff;box-shadow:0 0 0 2px #2f66d0,0 8px 18px rgba(3,12,34,.2);align-self:flex-start}
.wdCharPreviewActions{display:flex;gap:8px}
.wdCharError{color:#b3261e;font-size:12px;line-height:16px}
.wdCharFile{display:none}
.wdCharEditor--page .wdCharLabel{color:var(--dsw-alias-label-primary)}
.wdCharEditor--page .wdCharHint{color:var(--dsw-alias-label-secondary)}
.wdCharEditor--page .wdCharInput{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.wdCharEditor--page .wdCharInput:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px rgba(74,134,232,.25)}
.wdCharEditor--page .wdCharBtn{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.wdCharEditor--page .wdCharBtnGhost{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}
.wdCharEditor--page .wdCharBtnGhost:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.wdCharEditor--page .wdCharThumb{border-color:var(--dsw-alias-bg-layer-1);box-shadow:0 0 0 1px var(--dsw-alias-border-l2)}
.wdCharEditor--page .wdCharPreview{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}
.wdCharEditor--page .wdCharPreviewLabel{color:var(--dsw-alias-label-secondary)}
.wdCharEditor--page .wdCharPreviewImage{border-color:var(--dsw-alias-bg-layer-1);box-shadow:0 0 0 1px var(--dsw-alias-border-l2),0 8px 18px rgba(0,0,0,.15)}
.wdCharEditor--page .wdCharError{color:var(--dsw-alias-state-error-primary)}
`


    function readLocal(sessionId, field) {
      try {
        return window.localStorage.getItem(LOCAL_PREFIX + '.' + sessionId + '.' + field)
      } catch (error) {
        return null
      }
    }

    function writeLocal(sessionId, field, value) {
      try {
        window.localStorage.setItem(LOCAL_PREFIX + '.' + sessionId + '.' + field, value)
        return true
      } catch (error) {
        return false
      }
    }

    function removeLocal(sessionId, field) {
      try {
        window.localStorage.removeItem(LOCAL_PREFIX + '.' + sessionId + '.' + field)
      } catch (error) {
        /* ignore */
      }
    }

    function clampNumber(value, min, max, fallback) {
      const number = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(number)) return fallback
      return Math.min(max, Math.max(min, Math.round(number)))
    }

    function normalizeSettings(input) {
      const source = input !== null && typeof input === 'object' ? input : {}
      return {
        portraitSide: source.portraitSide === 'left' ? 'left' : 'right',
        frameWidth: clampNumber(source.frameWidth, 720, 1240, DEFAULT_SETTINGS.frameWidth),
        fontSize: clampNumber(source.fontSize, 13, 20, DEFAULT_SETTINGS.fontSize),
        sound: source.sound !== false,
      }
    }

    function readSettings() {
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY)
        if (raw === null) return { ...DEFAULT_SETTINGS }
        return normalizeSettings(JSON.parse(raw))
      } catch (error) {
        return { ...DEFAULT_SETTINGS }
      }
    }

    let currentSettings = readSettings()
    const settingsListeners = new Set()

    function getSettings() {
      return currentSettings
    }

    function setSettings(patch) {
      const next = normalizeSettings({ ...currentSettings, ...patch })
      const changed = next.portraitSide !== currentSettings.portraitSide ||
        next.frameWidth !== currentSettings.frameWidth ||
        next.fontSize !== currentSettings.fontSize ||
        next.sound !== currentSettings.sound
      currentSettings = next
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch (error) {
        /* ignore quotas and private modes */
      }
      if (changed) for (const listener of settingsListeners) listener()
    }

    function subscribeSettings(listener) {
      settingsListeners.add(listener)
      return () => settingsListeners.delete(listener)
    }

    const characterListeners = new Set()

    function readCharacter() {
      return {
        portrait: readLocal(CHARACTER_OWNER, 'portrait') || DEFAULT_PORTRAIT,
        name: readLocal(CHARACTER_OWNER, 'name') || DEFAULT_NAME
      }
    }

    let currentCharacter = readCharacter()

    function getCharacter() {
      return currentCharacter
    }

    function setCharacter(patch) {
      const next = {
        portrait: patch.portrait !== undefined ? patch.portrait : currentCharacter.portrait,
        name: patch.name !== undefined ? patch.name : currentCharacter.name
      }
      const changed = next.portrait !== currentCharacter.portrait || next.name !== currentCharacter.name
      if (patch.portrait !== undefined) {
        if (next.portrait === DEFAULT_PORTRAIT) removeLocal(CHARACTER_OWNER, 'portrait')
        else writeLocal(CHARACTER_OWNER, 'portrait', next.portrait)
      }
      if (patch.name !== undefined) {
        if (next.name === DEFAULT_NAME) removeLocal(CHARACTER_OWNER, 'name')
        else writeLocal(CHARACTER_OWNER, 'name', next.name)
      }
      currentCharacter = next
      if (changed) for (const listener of characterListeners) listener()
    }

    function subscribeCharacter(listener) {
      characterListeners.add(listener)
      return () => characterListeners.delete(listener)
    }

    function useCharacterSnapshot() {
      const [character, setLocalCharacter] = useState(getCharacter)
      useEffect(() => subscribeCharacter(() => setLocalCharacter(getCharacter())), [])
      return character
    }

    let pluginContext = null

    function getClientService(name) {
      try {
        return pluginContext === null ? undefined : pluginContext.get(name)
      } catch (error) {
        return undefined
      }
    }

    /** Shared per-session model directory (same one the official composer uses). */
    function useModelDirectory(sessionId) {
      const [model, setModel] = useState({ snapshot: null, directory: null })
      useEffect(() => {
        let directory = null
        try {
          const service = getClientService('modelDirectories')
          if (service === undefined || typeof service.directoryFor !== 'function') return undefined
          directory = service.directoryFor(sessionId)
        } catch (error) {
          return undefined
        }
        const update = () => setModel({ snapshot: directory.store.getSnapshot(), directory })
        update()
        const unsubscribe = directory.store.subscribe(update)
        directory.load().catch(() => {})
        return () => unsubscribe()
      }, [sessionId])
      return model
    }

    let audioContext = null

    function ensureAudio() {
      try {
        if (audioContext !== null) return audioContext
        const AudioCtor = window.AudioContext || window.webkitAudioContext
        if (AudioCtor === undefined) return null
        audioContext = new AudioCtor()
        return audioContext
      } catch (error) {
        return null
      }
    }

    function resumeAudio() {
      const context = ensureAudio()
      if (context !== null && context.state === 'suspended') {
        context.resume().catch(() => {})
      }
    }

    /** A very soft three-note chime used when a new reply appears. */
    function playChime() {
      const context = ensureAudio()
      if (context === null) return
      if (context.state === 'suspended') context.resume().catch(() => {})
      try {
        const now = context.currentTime + 0.01
        const master = context.createGain()
        master.gain.setValueAtTime(0.0001, now)
        master.gain.exponentialRampToValueAtTime(0.035, now + 0.03)
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
        master.connect(context.destination)
        const notes = [880, 1174.66, 1567.98]
        for (let index = 0; index < notes.length; index += 1) {
          const start = now + index * 0.075
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.value = notes[index]
          gain.gain.setValueAtTime(0.0001, start)
          gain.gain.exponentialRampToValueAtTime(0.4, start + 0.012)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55)
          oscillator.connect(gain)
          gain.connect(master)
          oscillator.start(start)
          oscillator.stop(start + 0.6)
        }
      } catch (error) {
        /* audio is optional */
      }
    }

    /** Reveal text one character at a time; a skip call shows the whole reply. */
    function useTypewriter(fullText, replyKey) {
      const [count, setCount] = useState(() => fullText.length)
      const [reducedMotion] = useState(() => {
        try {
          return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        } catch (error) {
          return false
        }
      })
      const countRef = useRef(fullText.length)
      const textRef = useRef(fullText)
      const keyRef = useRef(replyKey)
      const lastTimeRef = useRef(0)

      useEffect(() => {
        const previous = textRef.current
        const replaced = fullText.length < previous.length || (previous !== '' && fullText.indexOf(previous) !== 0)
        const keyChanged = keyRef.current !== replyKey
        keyRef.current = replyKey
        textRef.current = fullText
        if (keyChanged || replaced) {
          countRef.current = reducedMotion ? fullText.length : 0
          lastTimeRef.current = 0
          setCount(countRef.current)
        } else if (reducedMotion && countRef.current < fullText.length) {
          countRef.current = fullText.length
          setCount(countRef.current)
        }
      }, [fullText, replyKey, reducedMotion])

      useEffect(() => {
        if (reducedMotion) return undefined
        let frame = 0
        let stopped = false
        const step = (time) => {
          if (stopped) return
          const target = textRef.current.length
          if (countRef.current < target) {
            if (lastTimeRef.current === 0) lastTimeRef.current = time
            const elapsed = time - lastTimeRef.current
            const advance = Math.floor(elapsed / TYPE_INTERVAL_MS)
            if (advance > 0) {
              countRef.current = Math.min(target, countRef.current + advance)
              lastTimeRef.current = time
              setCount(countRef.current)
            }
          } else {
            lastTimeRef.current = 0
          }
          frame = window.requestAnimationFrame(step)
        }
        frame = window.requestAnimationFrame(step)
        return () => {
          stopped = true
          window.cancelAnimationFrame(frame)
        }
      }, [reducedMotion])

      const skip = () => {
        if (countRef.current < textRef.current.length) {
          countRef.current = textRef.current.length
          lastTimeRef.current = 0
          setCount(countRef.current)
        }
      }

      return { visible: fullText.slice(0, count), typing: count < fullText.length, skip }
    }

    /** Seed the target session's persisted View preference once, before the session store materializes. */
    function seedViewPreference() {
      if (TARGET_SESSION === '') return
      try {
        const key = CONVERSATION_KEY + '.' + TARGET_SESSION
        const raw = window.localStorage.getItem(key)
        const state = raw === null ? {} : JSON.parse(raw)
        if (state === null || typeof state !== 'object' || Array.isArray(state)) return
        if (typeof state.view === 'string' && state.view.length > 0) return
        state.view = VIEW_ID
        window.localStorage.setItem(key, JSON.stringify(state))
      } catch (error) {
        /* ignore: never break the app over a preference seed */
      }
    }

    function inlineNodes(text, keyBase) {
      const out = []
      const re = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g
      let last = 0
      let index = 0
      let match
      while ((match = re.exec(text)) !== null) {
        if (match.index > last) out.push(text.slice(last, match.index))
        const token = match[0]
        const key = keyBase + '-' + index
        index += 1
        if (token.charCodeAt(0) === 96) out.push(h('code', { key }, token.slice(1, -1)))
        else if (token.slice(0, 2) === '**') out.push(h('strong', { key }, token.slice(2, -2)))
        else out.push(h('em', { key }, token.slice(1, -1)))
        last = match.index + token.length
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    function renderParagraph(lines, key) {
      const children = []
      for (let index = 0; index < lines.length; index += 1) {
        if (index > 0) children.push(h('br', { key: 'br' + index }))
        const nodes = inlineNodes(lines[index], key + '-l' + index)
        for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) children.push(nodes[nodeIndex])
      }
      return h('p', { key }, children)
    }

    function parseMarkdown(source) {
      const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n')
      const nodes = []
      let paragraph = []
      let index = 0
      let key = 0
      const flush = () => {
        if (paragraph.length === 0) return
        nodes.push(renderParagraph(paragraph, 'p' + key))
        key += 1
        paragraph = []
      }
      while (index < lines.length) {
        const line = lines[index]
        if (line.slice(0, 3) === '```') {
          flush()
          const buffer = []
          index += 1
          while (index < lines.length && !/^```\s*$/.test(lines[index])) {
            buffer.push(lines[index])
            index += 1
          }
          if (index < lines.length) index += 1
          nodes.push(h('pre', { key: 'pre' + key }, h('code', null, buffer.join('\n'))))
          key += 1
          continue
        }
        if (/^\s*$/.test(line)) {
          flush()
          index += 1
          continue
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line)
        if (heading !== null) {
          flush()
          nodes.push(h('h5', { key: 'h' + key }, inlineNodes(heading[2], 'h' + key)))
          key += 1
          index += 1
          continue
        }
        if (/^\s*[-*+]\s+/.test(line)) {
          flush()
          const items = []
          while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*[-*+]\s+/, ''))
            index += 1
          }
          const listKey = 'ul' + key
          nodes.push(h('ul', { key: listKey }, items.map((item, itemIndex) => h('li', { key: itemIndex }, inlineNodes(item, listKey + '-' + itemIndex)))))
          key += 1
          continue
        }
        if (/^\s*\d+[.)]\s+/.test(line)) {
          flush()
          const items = []
          while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
            items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ''))
            index += 1
          }
          const listKey = 'ol' + key
          nodes.push(h('ol', { key: listKey }, items.map((item, itemIndex) => h('li', { key: itemIndex }, inlineNodes(item, listKey + '-' + itemIndex)))))
          key += 1
          continue
        }
        if (/^\s*>\s?/.test(line)) {
          flush()
          const buffer = []
          while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
            buffer.push(lines[index].replace(/^\s*>\s?/, ''))
            index += 1
          }
          nodes.push(h('blockquote', { key: 'bq' + key }, inlineNodes(buffer.join('\n'), 'bq' + key)))
          key += 1
          continue
        }
        paragraph.push(line)
        index += 1
      }
      flush()
      return nodes
    }

    function Markdown({ text, streaming }) {
      const nodes = useMemo(() => parseMarkdown(text), [text])
      return h('div', { className: 'wd-rich', 'data-streaming': streaming ? 'true' : 'false' }, nodes)
    }

    function WhaleGlyph({ className }) {
      return h('svg', { className, viewBox: '0 0 96 72', fill: 'currentColor', 'aria-hidden': 'true' },
        h('path', { d: WHALE_PATH })
      )
    }

    /** A blue-and-white ribbon bow at the top of the frame. */
    function BowGlyph({ className }) {
      return h('svg', { className, viewBox: '0 0 72 50', 'aria-hidden': 'true' },
        h('path', { d: 'M34 24C23 8 7 9 9 23c1 10 14 12 25 6Z', fill: '#5f9bf2', stroke: '#173a86', 'stroke-width': 2 }),
        h('path', { d: 'M38 24c11-16 27-15 25-1-1 10-14 12-25 6Z', fill: '#5f9bf2', stroke: '#173a86', 'stroke-width': 2 }),
        h('path', { d: 'M34 26c-3 8-7 14-12 19l12-7Z', fill: '#2f66d0', stroke: '#173a86', 'stroke-width': 1.6 }),
        h('path', { d: 'M38 26c3 8 7 14 12 19l-12-7Z', fill: '#2f66d0', stroke: '#173a86', 'stroke-width': 1.6 }),
        h('rect', { x: 28, y: 19, width: 16, height: 13, rx: 5, fill: '#cfe4ff', stroke: '#173a86', 'stroke-width': 2 }),
        h('path', { d: 'M20 17c4-3 9-2 11 2', fill: 'none', stroke: '#eaf4ff', 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
        h('path', { d: 'M52 17c-4-3-9-2-11 2', fill: 'none', stroke: '#eaf4ff', 'stroke-width': 2.2, 'stroke-linecap': 'round' })
      )
    }

    /** A small whale-tail glyph used in the send button. */
    function TailGlyph({ className }) {
      return h('svg', { className, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
        h('path', { d: 'M12 3c.8 5.4 2.6 8.6 6 11-2.8 1-5.2.6-6-1.4-.8 2-3.2 2.4-6 1.4 3.4-2.4 5.2-5.6 6-11Z' })
      )
    }

    /** Layered undersea backdrop: light from the surface, distant whales, fish, seabed. */
    function SceneBackdrop({ className }) {
      return h('svg', {
        className,
        viewBox: '0 0 1200 800',
        preserveAspectRatio: 'xMidYMid slice',
        'aria-hidden': 'true'
      },
        h('defs', null,
          h('linearGradient', { id: 'wdSea', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0', stopColor: '#1a4f86' }),
            h('stop', { offset: '0.35', stopColor: '#123a66' }),
            h('stop', { offset: '0.72', stopColor: '#0a2340' }),
            h('stop', { offset: '1', stopColor: '#04101d' })
          ),
          h('radialGradient', { id: 'wdSurface', cx: '50%', cy: '0%', r: '80%' },
            h('stop', { offset: '0', stopColor: '#d8f1ff', stopOpacity: '0.5' }),
            h('stop', { offset: '0.45', stopColor: '#6fb2ee', stopOpacity: '0.12' }),
            h('stop', { offset: '1', stopColor: '#0b1f3a', stopOpacity: '0' })
          ),
          h('radialGradient', { id: 'wdGlow', cx: '50%', cy: '50%', r: '50%' },
            h('stop', { offset: '0', stopColor: '#6fb6ff', stopOpacity: '0.18' }),
            h('stop', { offset: '1', stopColor: '#6fb6ff', stopOpacity: '0' })
          ),
          h('filter', { id: 'wdSoft', x: '-20%', y: '-20%', width: '140%', height: '140%' },
            h('feGaussianBlur', { stdDeviation: 14 })
          )
        ),
        h('rect', { width: 1200, height: 800, fill: 'url(#wdSea)' }),
        h('ellipse', { cx: 600, cy: 40, rx: 760, ry: 430, fill: 'url(#wdSurface)' }),
        h('g', { className: 'wd-rays', fill: '#d9f0ff', opacity: '0.1', filter: 'url(#wdSoft)' },
          h('polygon', { points: '300,-40 400,-40 250,820 130,820' }),
          h('polygon', { points: '610,-40 700,-40 830,820 690,820' }),
          h('polygon', { points: '880,-40 960,-40 1090,820 970,820' }),
          h('polygon', { points: '470,-40 510,-40 430,820 370,820' })
        ),
        h('ellipse', { cx: 610, cy: 650, rx: 520, ry: 220, fill: 'url(#wdGlow)' }),
        h('g', { transform: 'translate(680 165) scale(3.2)', opacity: '0.08', fill: '#b7dcf8' },
          h('g', { className: 'wd-swimA' }, h('path', { d: WHALE_PATH }))
        ),
        h('g', { transform: 'translate(140 395) scale(1.5)', opacity: '0.06', fill: '#a9d4f5' },
          h('g', { className: 'wd-swimB' }, h('path', { d: WHALE_PATH }))
        ),
        h('g', { className: 'wd-fish', fill: '#a9d4f5', opacity: '0.16' },
          h('g', { transform: 'translate(250 320)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' })),
          h('g', { transform: 'translate(292 300) scale(0.8)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' })),
          h('g', { transform: 'translate(330 340) scale(1.1)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' })),
          h('g', { transform: 'translate(226 356) scale(0.7)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' })),
          h('g', { transform: 'translate(362 314) scale(0.9)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' })),
          h('g', { transform: 'translate(402 344) scale(0.6)' }, h('path', { d: 'M0 0c7-4 16-4 22 0-6 4-15 4-22 0Z' }), h('path', { d: 'M-1 0l-6-4v8Z' }))
        ),
        h('path', {
          d: 'M0 706 C120 688 196 728 320 706 C444 684 520 734 640 714 C760 694 842 736 960 716 C1080 696 1140 728 1200 712 L1200 800 L0 800 Z',
          fill: '#04101d',
          opacity: '0.92'
        }),
        h('g', { fill: 'none', stroke: '#0a2740', strokeWidth: 14, strokeLinecap: 'round', opacity: '0.75' },
          h('path', { d: 'M40 800 C20 730 66 690 46 620 C26 560 72 520 54 470' }),
          h('path', { d: 'M96 800 C78 744 118 706 102 650 C88 604 124 574 112 534' }),
          h('path', { d: 'M1120 800 C1140 736 1100 696 1116 636 C1130 586 1096 552 1108 508' }),
          h('path', { d: 'M1170 800 C1188 748 1152 712 1166 660 C1178 618 1148 588 1158 552' })
        )
      )
    }

    function fileToPortrait(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('read failed'))
        reader.onload = () => {
          const image = new Image()
          image.onerror = () => reject(new Error('decode failed'))
          image.onload = () => {
            try {
              const size = 512
              const canvas = document.createElement('canvas')
              canvas.width = size
              canvas.height = size
              const context = canvas.getContext('2d')
              if (context === null) throw new Error('canvas unavailable')
              const scale = Math.max(size / image.width, size / image.height)
              const width = image.width * scale
              const height = image.height * scale
              context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
              resolve(canvas.toDataURL('image/jpeg', 0.86))
            } catch (error) {
              reject(error)
            }
          }
          image.src = String(reader.result)
        }
        reader.readAsDataURL(file)
      })
    }

    function selectChat(snapshot) {
      try {
        if (snapshot === undefined || snapshot === null) return EMPTY_CHAT
        const order = snapshot.order
        const nodes = snapshot.nodes
        if (!Array.isArray(order) || nodes === undefined || nodes === null || typeof nodes.get !== 'function') return EMPTY_CHAT
        let latestAssistant = null
        let latestReply = null
        let lastUserSeq = -1
        let lastUserText = ''
        for (let index = 0; index < order.length; index += 1) {
          const node = nodes.get(order[index])
          if (node === undefined || node === null) continue
          if (node.kind === 'user') {
            const seq = typeof node.anchorSeq === 'number' ? node.anchorSeq : 0
            if (seq > lastUserSeq) {
              lastUserSeq = seq
              const content = node.data !== null && typeof node.data === 'object' && Array.isArray(node.data.content) ? node.data.content : []
              const parts = []
              for (let blockIndex = 0; blockIndex < content.length; blockIndex += 1) {
                const block = content[blockIndex]
                if (block !== null && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
              }
              lastUserText = parts.join(' ')
            }
          } else if (node.kind === 'assistant-step' && node.visibility !== 'hidden') {
            latestAssistant = node
            const blocks = node.data !== null && typeof node.data === 'object' && Array.isArray(node.data.blocks) ? node.data.blocks : []
            for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
              const candidate = blocks[blockIndex]
              if (candidate !== null && typeof candidate === 'object' && candidate.kind === 'text' && typeof candidate.text === 'string' && candidate.text.trim() !== '') {
                latestReply = node
                break
              }
            }
          }
        }
        const shown = latestReply !== null ? latestReply : latestAssistant
        if (shown === null) {
          return { key: '', text: '', status: 'none', lastUserSeq, lastUserText, turn: undefined, step: undefined }
        }
        const data = shown.data !== null && typeof shown.data === 'object' ? shown.data : {}
        const blocks = Array.isArray(data.blocks) ? data.blocks : []
        const parts = []
        for (let index = 0; index < blocks.length; index += 1) {
          const block = blocks[index]
          if (block !== null && typeof block === 'object' && block.kind === 'text' && typeof block.text === 'string' && block.text.trim() !== '') {
            parts.push(block.text.trim())
          }
        }
        const anchor = typeof shown.anchorSeq === 'number' ? shown.anchorSeq : 0
        const current = anchor > lastUserSeq
        return {
          key: current && typeof shown.key === 'string' ? shown.key : '',
          text: current ? parts.join('\n\n') : '',
          status: current ? (typeof data.status === 'string' ? data.status : 'settled') : 'none',
          lastUserSeq,
          lastUserText,
          turn: data.turn,
          step: data.step
        }
      } catch (error) {
        return EMPTY_CHAT
      }
    }

    function sameChat(left, right) {
      if (left === undefined || left === null || right === undefined || right === null) return left === right
      return left.key === right.key && left.text === right.text && left.status === right.status && left.lastUserSeq === right.lastUserSeq && left.lastUserText === right.lastUserText
    }

    const HAPPY_WORDS = ['开心', '高兴', '快乐', '好耶', '太好了', '太棒了', '哈哈', '嘿嘿', '嘻嘻', '喜欢', '爱你', '谢谢', '感谢', '厉害', '不错', '满意', '可爱', '期待', '舒服', '温柔', '抱抱', '加油', '有趣', '惊喜', '幸福', '甜蜜', '美好', '顺利', '成功', '好棒', '太棒', '真棒', 'happy', 'glad', 'great', 'love', 'thanks', 'thank', 'nice', 'awesome', 'good', 'yay', 'haha', 'lol', 'wonderful', 'excited']
    const SAD_WORDS = ['难过', '伤心', '想哭', '哭了', '好累', '很累', '累了', '心累', '烦躁', '烦死', '好烦', '很烦', '烦人', '讨厌', '生气', '气死', '失望', '不开心', '不喜欢', '不高兴', '郁闷', '焦虑', '害怕', '委屈', '崩溃', '糟糕', '失败', '痛苦', '压力', '孤独', '呜呜', '无语', '难受', '悲伤', '沮丧', '绝望', '担心', '紧张', '失眠', '生病', 'sad', 'cry', 'angry', 'hate', 'tired', 'upset', 'sorry', 'bad', 'awful', 'terrible', 'depressed', 'lonely', 'anxious', 'worried', 'stress']
    const HAPPY_EMOJI = ['😊', '😄', '😁', '🥰', '❤️', '❤', '💕', '✨', '🎉', '😆', '😍', '🤗', '😘', '😀', '😃']
    const SAD_EMOJI = ['😢', '😭', '😞', '😔', '💔', '😣', '😖', '😩', '🥺', '😿', '😟']
    const PERMISSION_OPTIONS = [
      { id: 'read-only', label: '仅可查看' },
      { id: 'workspace-write', label: '工作区内修改' },
      { id: 'danger-full-access', label: '完全权限' }
    ]

    function countHits(text, words) {
      let total = 0
      for (let index = 0; index < words.length; index += 1) {
        const word = words[index]
        let at = text.indexOf(word)
        while (at !== -1) {
          total += 1
          at = text.indexOf(word, at + word.length)
        }
      }
      return total
    }

    /** Rough sentiment of the user's latest message: happy, sad, or neutral. */
    function detectEmotion(text) {
      const normalized = String(text || '').toLowerCase().trim()
      if (normalized === '') return null
      let negative = countHits(normalized, SAD_WORDS) + countHits(normalized, SAD_EMOJI)
      let rest = normalized
      for (let index = 0; index < SAD_WORDS.length; index += 1) {
        rest = rest.split(SAD_WORDS[index]).join(' ')
      }
      const positive = countHits(rest, HAPPY_WORDS) + countHits(normalized, HAPPY_EMOJI)
      if (positive > negative) return 'happy'
      if (negative > positive) return 'sad'
      return null
    }

    function useSettingsSnapshot() {
      const [settings, setLocalSettings] = useState(getSettings)
      useEffect(() => subscribeSettings(() => setLocalSettings(getSettings())), [])
      return settings
    }

    function WhaleSettings() {
      const settings = useSettingsSnapshot()
      const update = (patch) => setSettings(patch)
      return h('div', { className: 'wdgs' },
        h('style', null, SETTINGS_CSS + CHARACTER_CSS),
        h('p', { className: 'wdgsIntro' }, '调整「鲸鱼对话」的外观与提示音。修改会立即应用，并保存在当前浏览器。'),
        h('div', { className: 'wdgsSection' },
          h('div', { className: 'wdgsLabel' }, '角色与立绘'),
          h('div', { className: 'wdgsDesc' }, '名字与立绘只影响「鲸鱼对话」这个会话；选择图片后会先预览，确认后才替换。'),
          h(CharacterEditor, { variant: 'page' })
        ),
        h('div', { className: 'wdgsRow' },
          h('div', null,
            h('div', { className: 'wdgsLabel' }, '立绘位置'),
            h('div', { className: 'wdgsDesc' }, '立绘显示在对话框的左侧或右侧。')
          ),
          h('div', { className: 'wdgsSeg', role: 'group', 'aria-label': '立绘位置' },
            h('button', {
              type: 'button',
              className: 'wdgsSegBtn',
              'data-active': settings.portraitSide === 'left' ? 'true' : 'false',
              onClick: () => update({ portraitSide: 'left' })
            }, '左侧'),
            h('button', {
              type: 'button',
              className: 'wdgsSegBtn',
              'data-active': settings.portraitSide === 'right' ? 'true' : 'false',
              onClick: () => update({ portraitSide: 'right' })
            }, '右侧')
          )
        ),
        h('div', { className: 'wdgsRow' },
          h('div', null,
            h('div', { className: 'wdgsLabel' }, '对话框宽度'),
            h('div', { className: 'wdgsDesc' }, '框体与输入栏的最大宽度。')
          ),
          h('div', { className: 'wdgsControl' },
            h('input', {
              type: 'range',
              className: 'wdgsRange',
              min: 720,
              max: 1240,
              step: 20,
              value: settings.frameWidth,
              'aria-label': '对话框宽度',
              onChange: (event) => update({ frameWidth: Number(event.target.value) })
            }),
            h('span', { className: 'wdgsValue' }, settings.frameWidth + ' px')
          )
        ),
        h('div', { className: 'wdgsRow' },
          h('div', null,
            h('div', { className: 'wdgsLabel' }, '对话字号'),
            h('div', { className: 'wdgsDesc' }, '对话文字的大小，13–20 px。')
          ),
          h('div', { className: 'wdgsControl' },
            h('input', {
              type: 'range',
              className: 'wdgsRange',
              min: 13,
              max: 20,
              step: 1,
              value: settings.fontSize,
              'aria-label': '对话字号',
              onChange: (event) => update({ fontSize: Number(event.target.value) })
            }),
            h('span', { className: 'wdgsValue' }, settings.fontSize + ' px')
          )
        ),
        h('div', { className: 'wdgsRow' },
          h('div', null,
            h('div', { className: 'wdgsLabel' }, '提示音'),
            h('div', { className: 'wdgsDesc' }, '新回复出现时播放一段很轻的三音提示。')
          ),
          h('button', {
            type: 'button',
            className: 'wdgsSwitch',
            role: 'switch',
            'aria-checked': settings.sound ? 'true' : 'false',
            'aria-label': '提示音',
            onClick: () => update({ sound: !settings.sound })
          })
        ),
        h('div', { className: 'wdgsRow' },
          h('div', null,
            h('div', { className: 'wdgsLabel' }, '恢复默认'),
            h('div', { className: 'wdgsDesc' }, '把以上选项恢复为初始值。')
          ),
          h('div', { className: 'wdgsControl' },
            h('button', {
              type: 'button',
              className: 'wdgsReset',
              onClick: () => setSettings({ ...DEFAULT_SETTINGS })
            }, '恢复默认')
          )
        )
      )
    }

    /** Shared portrait + name editor used by the in-dialogue settings card and the settings page. */
    function CharacterEditor({ variant }) {
      const character = useCharacterSnapshot()
      const [nameDraft, setNameDraft] = useState(character.name)
      const [preview, setPreview] = useState(null)
      const [error, setError] = useState('')
      const [busy, setBusy] = useState(false)
      const fileRef = useRef(null)

      useEffect(() => {
        setNameDraft(character.name)
      }, [character.name])

      const commitName = () => {
        const next = nameDraft.trim().slice(0, 24) || DEFAULT_NAME
        setNameDraft(next)
        setCharacter({ name: next })
      }

      const resetName = () => {
        setNameDraft(DEFAULT_NAME)
        setCharacter({ name: DEFAULT_NAME })
      }

      const pickFile = () => {
        if (fileRef.current !== null) fileRef.current.click()
      }

      const onFile = async (event) => {
        const input = event.target
        const file = input.files !== null && input.files.length > 0 ? input.files[0] : null
        input.value = ''
        if (file === null) return
        if (typeof file.type === 'string' && file.type !== '' && file.type.indexOf('image/') !== 0) {
          setError('请选择图片文件')
          return
        }
        setBusy(true)
        setError('')
        try {
          setPreview(await fileToPortrait(file))
        } catch (err) {
          setError('图片处理失败，请换一张试试')
        } finally {
          setBusy(false)
        }
      }

      const confirmPortrait = () => {
        if (preview !== null) {
          setCharacter({ portrait: preview })
          setPreview(null)
        }
      }

      const resetPortrait = () => {
        setCharacter({ portrait: DEFAULT_PORTRAIT })
        setPreview(null)
      }

      const className = variant === 'page' ? 'wdCharEditor wdCharEditor--page' : 'wdCharEditor'

      return h('div', { className },
        h('div', { className: 'wdCharBlock' },
          h('div', { className: 'wdCharLabel' }, '名字'),
          h('div', { className: 'wdCharNameRow' },
            h('input', {
              className: 'wdCharInput',
              value: nameDraft,
              maxLength: 24,
              'aria-label': '角色名字',
              onChange: (event) => setNameDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitName()
                }
              }
            }),
            h('button', { type: 'button', className: 'wdCharBtn', onClick: commitName }, '保存'),
            h('button', { type: 'button', className: 'wdCharBtnGhost', onClick: resetName }, '默认')
          ),
          h('div', { className: 'wdCharHint' }, '显示在立绘下方，只影响本对话。')
        ),
        h('div', { className: 'wdCharBlock' },
          h('div', { className: 'wdCharLabel' }, '立绘'),
          h('div', { className: 'wdCharPortraitRow' },
            h('div', { className: 'wdCharThumb' }, h('img', { src: character.portrait, alt: '当前立绘' })),
            h('div', { className: 'wdCharActions' },
              h('button', {
                type: 'button',
                className: 'wdCharBtn',
                onClick: pickFile,
                disabled: busy
              }, busy ? '处理中…' : '选择图片…'),
              character.portrait !== DEFAULT_PORTRAIT
                ? h('button', { type: 'button', className: 'wdCharBtnGhost', onClick: resetPortrait }, '恢复默认')
                : null
            )
          ),
          h('div', { className: 'wdCharHint' }, '选择图片后会先显示预览，确认后才会替换。'),
          preview !== null ? h('div', { className: 'wdCharPreview' },
            h('div', { className: 'wdCharPreviewLabel' }, '预览（确认后替换当前立绘）'),
            h('img', { className: 'wdCharPreviewImage', src: preview, alt: '立绘预览' }),
            h('div', { className: 'wdCharPreviewActions' },
              h('button', { type: 'button', className: 'wdCharBtn', onClick: confirmPortrait }, '使用这张'),
              h('button', { type: 'button', className: 'wdCharBtnGhost', onClick: () => setPreview(null) }, '取消')
            )
          ) : null,
          error !== '' ? h('div', { className: 'wdCharError' }, error) : null
        ),
        h('input', {
          ref: fileRef,
          type: 'file',
          accept: 'image/*',
          className: 'wdCharFile',
          tabIndex: -1,
          'aria-hidden': 'true',
          onChange: onFile
        })
      )
    }

    function SettingsIcon() {
      return h('svg', {
        viewBox: '0 0 24 24',
        width: 15,
        height: 15,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.7,
        'stroke-linecap': 'round',
        'aria-hidden': 'true'
      },
        h('path', { d: 'M4 7h7M15 7h5M4 12h3M11 12h9M4 17h10M18 17h2' }),
        h('circle', { cx: 13, cy: 7, r: 2.2 }),
        h('circle', { cx: 9, cy: 12, r: 2.2 }),
        h('circle', { cx: 16, cy: 17, r: 2.2 })
      )
    }

    /** Compact settings card rendered inside the dialogue stage (no hooks, so it is safe to nest). */
    function WhaleQuickSettings({ settings, update, character, onEditCharacter }) {
      const row = (title, desc, control) => h('div', { className: 'wdpopRow' },
        h('div', { className: 'wdpopText' },
          h('div', { className: 'wdpopLabel' }, title),
          h('div', { className: 'wdpopDesc' }, desc)
        ),
        h('div', { className: 'wdpopControl' }, control)
      )
      return h('div', { className: 'wdpopBody' },
        row('角色与立绘', '当前名字：' + character.name, h('button', {
          type: 'button',
          className: 'wdpopEdit',
          onClick: onEditCharacter
        }, '编辑…')),
        row('立绘位置', '左侧 / 右侧', h('div', { className: 'wdpopSeg', role: 'group', 'aria-label': '立绘位置' },
          h('button', {
            type: 'button',
            className: 'wdpopSegBtn',
            'data-active': settings.portraitSide === 'left' ? 'true' : 'false',
            onClick: () => update({ portraitSide: 'left' })
          }, '左侧'),
          h('button', {
            type: 'button',
            className: 'wdpopSegBtn',
            'data-active': settings.portraitSide === 'right' ? 'true' : 'false',
            onClick: () => update({ portraitSide: 'right' })
          }, '右侧')
        )),
        row('对话框宽度', settings.frameWidth + ' px', h('input', {
          type: 'range',
          className: 'wdpopRange',
          min: 720,
          max: 1240,
          step: 20,
          value: settings.frameWidth,
          'aria-label': '对话框宽度',
          onChange: (event) => update({ frameWidth: Number(event.target.value) })
        })),
        row('对话字号', settings.fontSize + ' px', h('input', {
          type: 'range',
          className: 'wdpopRange',
          min: 13,
          max: 20,
          step: 1,
          value: settings.fontSize,
          'aria-label': '对话字号',
          onChange: (event) => update({ fontSize: Number(event.target.value) })
        })),
        row('提示音', settings.sound ? '开' : '关', h('button', {
          type: 'button',
          className: 'wdpopSwitch',
          role: 'switch',
          'aria-checked': settings.sound ? 'true' : 'false',
          'aria-label': '提示音',
          onClick: () => update({ sound: !settings.sound })
        })),
        row('恢复默认', '重置以上选项', h('button', {
          type: 'button',
          className: 'wdpopReset',
          onClick: () => setSettings({ ...DEFAULT_SETTINGS })
        }, '恢复'))
      )
    }

    function WhaleDialog(props) {
      const sessionId = props.sessionId
      const isTarget = TARGET_SESSION === '' || sessionId === TARGET_SESSION
      const useChat = props.useChat
      const useSessionStatus = props.useSessionStatus
      const openView = props.openView
      const viewRequest = props.viewRequest
      const completeViewRequest = props.completeViewRequest

      const chat = typeof useChat === 'function' ? useChat(selectChat, sameChat) : EMPTY_CHAT
      const rawText = chat !== undefined && chat !== null && typeof chat.text === 'string' ? chat.text : ''
      const replyKey = chat !== undefined && chat !== null && typeof chat.key === 'string' ? chat.key : ''
      const settings = useSettingsSnapshot()
      const typewriter = useTypewriter(rawText, replyKey)
      const runningSelector = useCallback((snapshot) => {
        try {
          if (snapshot === undefined || snapshot === null || typeof snapshot.get !== 'function') return false
          const status = snapshot.get(sessionId)
          return Boolean(status && status.running === true)
        } catch (error) {
          return false
        }
      }, [sessionId])
      const running = typeof useSessionStatus === 'function' ? useSessionStatus(runningSelector) : false
      const pendingSelector = useCallback((snapshot) => {
        try {
          if (snapshot === undefined || snapshot === null || typeof snapshot.get !== 'function') return false
          const status = snapshot.get(sessionId)
          return Boolean(status && status.pendingInteraction)
        } catch (error) {
          return false
        }
      }, [sessionId])
      const pending = typeof useSessionStatus === 'function' ? useSessionStatus(pendingSelector) : false
      const model = useModelDirectory(sessionId)
      const permissions = typeof props.useProjection === 'function' ? props.useProjection('permissions') : undefined

      const character = useCharacterSnapshot()
      const portrait = character.portrait
      const name = character.name
      const [notice, setNotice] = useState('')
      const [message, setMessage] = useState('')
      const [openMenu, setOpenMenu] = useState(null)
      const [permissionConfirm, setPermissionConfirm] = useState(null)
      const [effortDraft, setEffortDraft] = useState(null)
      const [effortDragging, setEffortDragging] = useState(false)
      const [effortDragPercent, setEffortDragPercent] = useState(null)
      const [attachments, setAttachments] = useState([])
      const [uploads, setUploads] = useState({})
      const attachmentInputRef = useRef(null)
      const [sending, setSending] = useState(false)
      const [settingsOpen, setSettingsOpen] = useState(false)
      const [characterOpen, setCharacterOpen] = useState(false)
      const [reaction, setReaction] = useState(null)
      const [reactionVisible, setReactionVisible] = useState(false)
      const messageInputRef = useRef(null)
      const settingsCardRef = useRef(null)
      const characterCardRef = useRef(null)
      const effortRailRef = useRef(null)
      const effortDraggingRef = useRef(false)
      const chimeTurnRef = useRef(chat !== undefined && chat !== null ? chat.turn : undefined)
      const lastUserSeqRef = useRef(chat !== undefined && chat !== null ? chat.lastUserSeq : -1)
      const inputActions = props.inputActions

      useEffect(() => {
        if (notice === '') return undefined
        const timer = window.setTimeout(() => setNotice(''), 2600)
        return () => window.clearTimeout(timer)
      }, [notice])

      useEffect(() => {
        const turn = chat !== undefined && chat !== null ? chat.turn : undefined
        if (turn === undefined || rawText.length === 0 || chimeTurnRef.current === turn) return
        chimeTurnRef.current = turn
        if (settings.sound) playChime()
      }, [chat, rawText, settings.sound])

      useEffect(() => {
        const seq = chat !== undefined && chat !== null ? chat.lastUserSeq : -1
        if (seq === lastUserSeqRef.current) return
        lastUserSeqRef.current = seq
        setReaction(detectEmotion(chat.lastUserText))
        setReactionVisible(false)
      }, [chat])

      useEffect(() => {
        if (viewRequest === undefined || viewRequest === null || typeof completeViewRequest !== 'function') return
        if (typeof viewRequest.view === 'string' && viewRequest.view !== VIEW_ID) return
        completeViewRequest()
      }, [viewRequest, completeViewRequest])

      useEffect(() => {
        if (attachments.length === 0) return undefined
        const conversation = getClientService('conversation')
        if (conversation === undefined || conversation === null || conversation.fileUploads === undefined) return undefined
        const store = conversation.fileUploads
        const update = () => setUploads(store.getSnapshot())
        update()
        return store.subscribe(update)
      }, [attachments.length])

      useEffect(() => {
        if (openMenu === null || typeof document === 'undefined') return undefined
        const onPointerDown = (event) => {
          const target = event.target
          if (target !== null && target !== undefined && typeof target.closest === 'function' &&
            (target.closest('.wd-menu') !== null || target.closest('.wd-tool') !== null)) return
          setOpenMenu(null)
          setPermissionConfirm(null)
          setEffortDraft(null)
          effortDraggingRef.current = false
          setEffortDragging(false)
          setEffortDragPercent(null)
        }
        document.addEventListener('pointerdown', onPointerDown)
        return () => document.removeEventListener('pointerdown', onPointerDown)
      }, [openMenu])

      useEffect(() => {
        if (!settingsOpen && !characterOpen && openMenu === null) return undefined
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            if (characterOpen) setCharacterOpen(false)
            else if (settingsOpen) setSettingsOpen(false)
            else {
              setOpenMenu(null)
              setPermissionConfirm(null)
              setEffortDraft(null)
              effortDraggingRef.current = false
              setEffortDragging(false)
              setEffortDragPercent(null)
            }
          }
        }
        window.addEventListener('keydown', onKeyDown)
        const card = characterOpen ? characterCardRef.current : (settingsOpen ? settingsCardRef.current : null)
        if (card !== null) card.focus()
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [settingsOpen, characterOpen, openMenu])

      const visibleText = typewriter.visible
      const typing = typewriter.typing
      const hasText = rawText.length > 0
      const thinking = running && !hasText
      const greeting = !running && !hasText && chat.lastUserSeq < 0
      const settledReply = !thinking && !running && !typing && chat.key !== ''
      const portraitMode = thinking
        ? 'thinking'
        : ((running || typing) ? 'speaking' : (reactionVisible && reaction !== null && settledReply ? reaction : 'idle'))
      const panelKey = replyKey !== '' ? 'node:' + replyKey : (thinking ? 'thinking' : 'empty')

      useEffect(() => {
        if (reaction === null || !settledReply) return undefined
        setReactionVisible(true)
        const timer = window.setTimeout(() => setReactionVisible(false), 6000)
        return () => window.clearTimeout(timer)
      }, [reaction, settledReply])

      const permissionValue = typeof permissions === 'string'
        ? permissions
        : (permissions !== null && permissions !== undefined && typeof permissions === 'object'
          ? (permissions.currentValue !== undefined ? permissions.currentValue : permissions.value)
          : undefined)
      const permissionLabel = (PERMISSION_OPTIONS.find((option) => option.id === permissionValue) || {}).label || '权限'
      const modelSnapshot = model !== undefined && model !== null ? model.snapshot : null
      const modelGroups = modelSnapshot !== null && modelSnapshot !== undefined && Array.isArray(modelSnapshot.groups) ? modelSnapshot.groups : []
      const currentSelection = modelSnapshot !== null && modelSnapshot !== undefined ? modelSnapshot.current : null
      let currentModelName = ''
      let currentEfforts = []
      let currentEffortId
      let currentEffortName = ''
      if (currentSelection !== null && currentSelection !== undefined) {
        for (let groupIndex = 0; groupIndex < modelGroups.length; groupIndex += 1) {
          const group = modelGroups[groupIndex]
          if (group === null || group === undefined || group.id !== currentSelection.provider) continue
          const models = Array.isArray(group.models) ? group.models : []
          for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
            const item = models[modelIndex]
            if (item === null || item === undefined || item.id !== currentSelection.model) continue
            currentModelName = typeof item.name === 'string' ? item.name : item.id
            const reasoning = item.reasoning !== null && item.reasoning !== undefined ? item.reasoning : null
            currentEfforts = reasoning !== null && Array.isArray(reasoning.efforts) ? reasoning.efforts : []
            currentEffortId = currentSelection.reasoningEffort !== undefined ? currentSelection.reasoningEffort : (reasoning !== null ? reasoning.defaultEffort : undefined)
            const effort = currentEfforts.find((level) => level.id === currentEffortId)
            currentEffortName = effort !== undefined && typeof effort.name === 'string' ? effort.name : (currentEffortId !== undefined ? String(currentEffortId) : '')
          }
        }
      }
      if (currentModelName === '' && currentSelection !== null && currentSelection !== undefined && typeof currentSelection.model === 'string') currentModelName = currentSelection.model
      const effortIndex = currentEfforts.length === 0 ? 0 : Math.max(0, currentEfforts.findIndex((level) => level.id === currentEffortId))
      const sliderIndex = currentEfforts.length === 0
        ? 0
        : (effortDraft === null ? effortIndex : Math.min(Math.max(0, effortDraft), currentEfforts.length - 1))
      const effortCount = currentEfforts.length
      const effortPercent = effortCount <= 1 ? 0 : (sliderIndex / (effortCount - 1)) * 100
      const displayedEffortPercent = effortDragging && effortDragPercent !== null ? effortDragPercent : effortPercent
      const activeEffortIndex = effortCount === 0
        ? 0
        : Math.min(effortCount - 1, Math.max(0, Math.round((displayedEffortPercent / 100) * (effortCount - 1))))
      const activeEffort = effortCount === 0 ? undefined : currentEfforts[activeEffortIndex]

      const closeMenus = () => {
        setOpenMenu(null)
        setPermissionConfirm(null)
        setEffortDraft(null)
        effortDraggingRef.current = false
        setEffortDragging(false)
        setEffortDragPercent(null)
      }

      const chooseModel = (group, item) => {
        closeMenus()
        const directory = model !== null && model !== undefined ? model.directory : null
        if (directory === null || directory === undefined) return
        directory.select({ provider: group.id, model: item.id }).then((result) => {
          if (!result || result.ok !== true) setNotice('模型切换失败')
        }).catch(() => setNotice('模型切换失败'))
      }

      const chooseEffort = (effortId) => {
        const directory = model !== null && model !== undefined ? model.directory : null
        if (directory === null || directory === undefined || currentSelection === null || currentSelection === undefined) return
        const selection = { provider: currentSelection.provider, model: currentSelection.model }
        if (effortId !== undefined) selection.reasoningEffort = effortId
        directory.select(selection).then((result) => {
          if (!result || result.ok !== true) setNotice('推理强度切换失败')
        }).catch(() => setNotice('推理强度切换失败'))
      }

      const applyEffortIndex = (index) => {
        const level = currentEfforts[index]
        if (level === undefined) return
        chooseEffort(level.id)
      }

      const effortPercentFromEvent = (event) => {
        const rail = effortRailRef.current
        if (rail === null) return 0
        const rect = rail.getBoundingClientRect()
        if (rect.width <= 0) return 0
        return Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
      }

      const onEffortPointerDown = (event) => {
        if (currentEfforts.length === 0) return
        const percent = effortPercentFromEvent(event)
        effortDraggingRef.current = true
        setEffortDragging(true)
        setEffortDragPercent(percent)
        try { event.currentTarget.setPointerCapture(event.pointerId) } catch (error) { /* ignore */ }
        event.preventDefault()
        try { event.currentTarget.focus() } catch (error) { /* ignore */ }
      }

      const onEffortPointerMove = (event) => {
        if (!effortDraggingRef.current) return
        setEffortDragPercent(effortPercentFromEvent(event))
      }

      const onEffortPointerUp = (event) => {
        if (!effortDraggingRef.current) return
        effortDraggingRef.current = false
        const percent = effortPercentFromEvent(event)
        const count = currentEfforts.length
        const nearest = count <= 1 ? 0 : Math.min(count - 1, Math.max(0, Math.round((percent / 100) * (count - 1))))
        setEffortDragging(false)
        setEffortDragPercent(null)
        setEffortDraft(nearest)
        applyEffortIndex(nearest)
        try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (error) { /* ignore */ }
      }

      const onEffortPointerCancel = () => {
        if (!effortDraggingRef.current) return
        effortDraggingRef.current = false
        setEffortDragging(false)
        setEffortDragPercent(null)
      }

      const onEffortKeyDown = (event) => {
        const count = currentEfforts.length
        if (count === 0) return
        let next = sliderIndex
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, sliderIndex - 1)
        else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(count - 1, sliderIndex + 1)
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = count - 1
        else return
        event.preventDefault()
        setEffortDragPercent(null)
        setEffortDraft(next)
        applyEffortIndex(next)
      }

      const runPermission = (id) => {
        closeMenus()
        if (!inputActions || typeof inputActions.setDraft !== 'function' || typeof inputActions.submit !== 'function') {
          setNotice('输入通道尚未就绪')
          return
        }
        try {
          inputActions.setDraft('/permission ' + id)
          window.setTimeout(() => {
            try {
              inputActions.submit()
            } catch (error) {
              setNotice('权限切换失败')
            }
          }, 40)
        } catch (error) {
          setNotice('权限切换失败')
        }
      }

      const choosePermission = (option) => {
        if (option.id === 'danger-full-access' && permissionValue !== option.id) {
          setPermissionConfirm(option.id)
          return
        }
        runPermission(option.id)
      }

      const attachmentStatus = (item) => {
        if (item.kind === 'image') return 'ready'
        const upload = uploads !== null && uploads !== undefined ? uploads[item.id] : undefined
        return upload !== undefined && upload !== null && typeof upload.status === 'string' ? upload.status : 'pending'
      }
      const attachmentBlocked = attachments.some((item) => attachmentStatus(item) !== 'ready')

      const openAttachmentPicker = () => {
        if (attachmentInputRef.current !== null) attachmentInputRef.current.click()
      }

      const onAttachFiles = (event) => {
        const input = event.target
        const files = input.files !== null && input.files.length > 0 ? Array.from(input.files) : []
        input.value = ''
        if (files.length === 0) return
        const conversation = getClientService('conversation')
        if (conversation === undefined || conversation === null || typeof conversation.createDrafts !== 'function' ||
          !inputActions || typeof inputActions.addAttachments !== 'function') {
          setNotice('附件通道尚未就绪')
          return
        }
        try {
          const drafts = conversation.createDrafts(sessionId, files)
          const ids = drafts.map((draft) => draft.id)
          if (!inputActions.addAttachments(ids)) {
            if (typeof conversation.releaseDraftAttachments === 'function') conversation.releaseDraftAttachments(drafts)
            setNotice('当前无法添加附件')
            return
          }
          setAttachments((previous) => [...previous, ...drafts.map((draft) => ({
            id: draft.id,
            kind: draft.kind,
            name: draft.file !== undefined && draft.file !== null && typeof draft.file.name === 'string' ? draft.file.name : '附件'
          }))])
        } catch (error) {
          setNotice('添加附件失败')
        }
      }

      const removeAttachment = (id) => {
        try {
          if (inputActions && typeof inputActions.removeAttachment === 'function') inputActions.removeAttachment(id)
        } catch (error) {
          /* ignore */
        }
        setAttachments((previous) => previous.filter((item) => item.id !== id))
      }

      const inputReady = inputActions !== undefined && inputActions !== null &&
        typeof inputActions.setDraft === 'function' && typeof inputActions.submit === 'function'
      const canSend = (message.trim() !== '' || attachments.length > 0) && !sending && !pending && inputReady && !attachmentBlocked

      const sendMessage = () => {
        const text = message.trim()
        if ((text === '' && attachments.length === 0) || sending || pending) return
        if (attachmentBlocked) {
          setNotice('附件还在上传，请稍候')
          return
        }
        if (!inputReady) {
          setNotice('输入通道尚未就绪，请稍后再试')
          return
        }
        resumeAudio()
        setSending(true)
        setMessage('')
        try {
          inputActions.setDraft(text)
        } catch (error) {
          setSending(false)
          setMessage(text)
          setNotice('写入输入框失败，请重试')
          return
        }
        window.setTimeout(() => {
          try {
            inputActions.submit()
            setAttachments([])
          } catch (error) {
            setNotice('发送失败，请重试')
          }
          setSending(false)
          if (messageInputRef.current !== null) messageInputRef.current.focus()
        }, 40)
      }

      const onMessageKeyDown = (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return
        const native = event.nativeEvent
        if (native !== undefined && native !== null && native.isComposing) return
        event.preventDefault()
        sendMessage()
      }

      const inputPlaceholder = pending
        ? '请先处理下方的提问或审批…'
        : (running ? 'DeepSeek 正在回应，可继续输入（回车排队）' : '对 DeepSeek 说点什么…')

      if (!isTarget) {
        return h('div', { className: 'wd-stage wd-stageForeign' },
          h('style', null, CSS + CHARACTER_CSS),
          h(WhaleGlyph, { className: 'wd-whale' }),
          h('div', { className: 'wd-foreignCard' },
            h('div', { className: 'wd-foreignTitle' }, '鲸鱼对话仅在本对话中启用'),
            h('p', { className: 'wd-foreignText' }, '这个模式是本对话专属的。其他对话仍然使用普通聊天界面。'),
            h('button', {
              type: 'button',
              className: 'wd-foreignBtn',
              onClick: () => { if (typeof openView === 'function') openView('chat', '') }
            }, '回到普通对话')
          )
        )
      }

      let body
      if (thinking) {
        body = h('div', { className: 'wd-thinking' },
          h('span', null, '正在思考'),
          h('span', { className: 'wd-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'))
        )
      } else if (hasText) {
        body = h(Markdown, { text: visibleText, streaming: running || typing })
      } else if (greeting) {
        body = h('div', { className: 'wd-greeting' }, '你好呀，我是 DeepSeek。今天想和你聊点什么？')
      } else {
        body = h('div', { className: 'wd-greeting' }, '……')
      }

      return h('div', {
        className: 'wd-stage',
        style: { '--wd-font-size': settings.fontSize + 'px' },
        onPointerDown: resumeAudio
      },
        h('style', null, CSS + CHARACTER_CSS),
        h(SceneBackdrop, { className: 'wd-scene' }),
        h('div', { className: 'wd-bubbles', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'), h('i'), h('i')),
        h('div', { className: 'wd-hud' },
          h('div', { className: 'wd-brand' },
            h('span', { className: 'wd-brandDot', 'aria-hidden': 'true' }),
            h('span', null, 'DeepSeek')
          ),
          h('div', { className: 'wd-hudRight' },
            h('div', { className: 'wd-state' },
              h('span', { className: running ? 'wd-stateDot is-live' : 'wd-stateDot', 'aria-hidden': 'true' }),
              h('span', null, running ? '正在回应' : '就绪')
            ),
            h('button', {
              type: 'button',
              className: 'wd-settingsBtn',
              title: '对话框设置',
              'aria-label': '对话框设置',
              'aria-expanded': settingsOpen ? 'true' : 'false',
              onClick: () => setSettingsOpen((value) => !value)
            }, h(SettingsIcon))
          )
        ),
        h('div', { className: 'wd-panelWrap', style: { maxWidth: settings.frameWidth + 'px' } },
          h('section', { className: 'wd-panel', key: panelKey, 'aria-live': 'polite' },
            h(BowGlyph, { className: 'wd-bow' }),
            h('span', { className: 'wd-rivet wd-rivet-tl', 'aria-hidden': 'true' }),
            h('span', { className: 'wd-rivet wd-rivet-tr', 'aria-hidden': 'true' }),
            h('span', { className: 'wd-rivet wd-rivet-bl', 'aria-hidden': 'true' }),
            h('span', { className: 'wd-rivet wd-rivet-br', 'aria-hidden': 'true' }),
            h('div', { className: 'wd-lace', 'aria-hidden': 'true' }),
            h('div', { className: 'wd-panelBody' + (settings.portraitSide === 'left' ? ' wd-panelBody--left' : '') },
              h(WhaleGlyph, { className: 'wd-paperWhale' }),
              h('div', {
                className: 'wd-text',
                onClick: typing ? typewriter.skip : undefined,
                title: typing ? '点击显示全文' : undefined,
                style: typing ? { cursor: 'pointer' } : undefined
              }, body, typing ? h('div', { className: 'wd-skip' }, '点击显示全文') : null),
              h('div', { className: 'wd-side' },
                h('div', { className: 'wd-frameWrap' },
                  h('div', { className: 'wd-frame' },
                    h('div', { className: 'wd-portraitStack', 'data-mode': portraitMode },
                      (portrait !== DEFAULT_PORTRAIT
                        ? [{ key: 'custom', src: portrait }]
                        : [
                          { key: 'idle', src: DEFAULT_PORTRAIT },
                          { key: 'thinking', src: THINKING_PORTRAIT },
                          { key: 'speaking', src: SPEAKING_PORTRAIT },
                          { key: 'happy', src: HAPPY_PORTRAIT },
                          { key: 'sad', src: SAD_PORTRAIT }
                        ]).map((layer) => {
                        const active = layer.key === 'custom' || layer.key === portraitMode
                        return h('img', {
                          key: layer.key,
                          className: active ? 'wd-portrait is-active' : 'wd-portrait',
                          src: layer.src,
                          alt: active ? name + ' 的立绘' : '',
                          'aria-hidden': active ? 'false' : 'true',
                          draggable: false
                        })
                      })
                    )
                  )
                ),
                h('div', { className: 'wd-name' }, name)
              )
            )
          ),
          h('div', { className: 'wd-tip' }, '点击对话显示全文 · 右上角设置可更换立绘与名字'),
          h('div', { className: 'wd-inputBar' },
            h('div', { className: 'wd-inputMain' },
              h('div', { className: 'wd-inputTools' },
                h('button', {
                  type: 'button',
                  className: 'wd-tool',
                  onClick: openAttachmentPicker,
                  title: '添加附件',
                  'aria-label': '添加附件'
                }, '附件'),
                h('button', {
                  type: 'button',
                  className: 'wd-tool',
                  onClick: () => {
                    setPermissionConfirm(null)
                    setOpenMenu(openMenu === 'model' ? null : 'model')
                  },
                  disabled: modelGroups.length === 0,
                  title: '选择模型'
                }, currentModelName || '模型'),
                currentEfforts.length > 0 ? h('button', {
                  type: 'button',
                  className: 'wd-tool',
                  onClick: () => {
                    setPermissionConfirm(null)
                    const next = openMenu === 'effort' ? null : 'effort'
                    effortDraggingRef.current = false
                    setEffortDragging(false)
                    setEffortDragPercent(null)
                    setEffortDraft(next === 'effort' ? effortIndex : null)
                    setOpenMenu(next)
                  },
                  title: '推理强度'
                }, currentEffortName || '推理') : null,
                h('button', {
                  type: 'button',
                  className: 'wd-tool',
                  onClick: () => {
                    setPermissionConfirm(null)
                    setOpenMenu(openMenu === 'permission' ? null : 'permission')
                  },
                  title: '权限'
                }, permissionLabel)
              ),
              h('textarea', {
                ref: messageInputRef,
                className: 'wd-input',
                rows: 1,
                value: message,
                placeholder: inputPlaceholder,
                disabled: pending,
                'aria-label': '输入对 DeepSeek 的消息',
                onChange: (event) => setMessage(event.target.value),
                onKeyDown: onMessageKeyDown
              }),
              attachments.length > 0 ? h('div', { className: 'wd-attachList' },
                attachments.map((item) => h('div', {
                  key: item.id,
                  className: 'wd-chip',
                  'data-status': attachmentStatus(item)
                }, h('span', null, item.name), h('button', {
                  type: 'button',
                  onClick: () => removeAttachment(item.id),
                  'aria-label': '移除 ' + item.name
                }, '×')))
              ) : null
            ),
            h('button', {
              type: 'button',
              className: 'wd-send',
              onClick: sendMessage,
              disabled: !canSend,
              title: '发送（Enter）',
            }, sending ? '…' : h(React.Fragment, null, h(TailGlyph, { className: 'wd-sendIcon' }), h('span', null, '发送'))),
            h('input', {
              ref: attachmentInputRef,
              type: 'file',
              multiple: true,
              className: 'wd-attachInput',
              tabIndex: -1,
              'aria-hidden': 'true',
              onChange: onAttachFiles
            }),
            openMenu === 'model' ? h('div', { className: 'wd-menu', role: 'menu' },
              h('div', { className: 'wd-menuTitle' }, '选择模型'),
              modelGroups.length === 0
                ? h('div', { className: 'wd-menuEmpty' }, modelSnapshot !== null && modelSnapshot !== undefined && modelSnapshot.status === 'loading' ? '正在读取模型…' : '暂无可用模型')
                : modelGroups.map((group) => h('div', { key: group.id },
                  h('div', { className: 'wd-menuTitle' }, typeof group.name === 'string' ? group.name : group.id),
                  (Array.isArray(group.models) ? group.models : []).map((item) => {
                    const active = currentSelection !== null && currentSelection !== undefined && currentSelection.provider === group.id && currentSelection.model === item.id
                    return h('button', {
                      key: item.id,
                      type: 'button',
                      className: 'wd-menuItem',
                      'data-active': active ? 'true' : 'false',
                      onClick: () => chooseModel(group, item)
                    }, h('span', null, typeof item.name === 'string' ? item.name : item.id), active ? h('span', { className: 'wd-menuCheck' }, '✓') : null)
                  })
                ))
            ) : null,
            openMenu === 'effort' ? h('div', { className: 'wd-menu wd-effortMenu', role: 'menu' },
              h('div', { className: 'wd-effortHead' },
                h('span', { className: 'wd-effortTitle' }, '推理强度'),
                h('span', { className: 'wd-effortValue' }, activeEffort !== undefined
                  ? (typeof activeEffort.name === 'string' ? activeEffort.name : activeEffort.id)
                  : '')
              ),
              h('div', {
                className: 'wd-effortSlider',
                'data-dragging': effortDragging ? 'true' : 'false',
                role: 'slider',
                tabIndex: 0,
                'aria-label': '推理强度',
                'aria-valuemin': 0,
                'aria-valuemax': Math.max(0, currentEfforts.length - 1),
                'aria-valuenow': activeEffortIndex,
                'aria-valuetext': activeEffort !== undefined ? (typeof activeEffort.name === 'string' ? activeEffort.name : activeEffort.id) : '',
                onPointerDown: onEffortPointerDown,
                onPointerMove: onEffortPointerMove,
                onPointerUp: onEffortPointerUp,
                onPointerCancel: onEffortPointerCancel,
                onKeyDown: onEffortKeyDown
              },
                h('div', { className: 'wd-effortRail', ref: effortRailRef },
                  h('div', { className: 'wd-effortFill', style: { width: displayedEffortPercent + '%' } }),
                  h('div', { className: 'wd-effortKnob', style: { left: displayedEffortPercent + '%' } })
                )
              ),
              h('div', { className: 'wd-effortTicks' },
                currentEfforts.map((level, index) => h('button', {
                  key: level.id,
                  type: 'button',
                  className: 'wd-effortTick',
                  'data-active': index === activeEffortIndex ? 'true' : 'false',
                  onClick: () => {
                    effortDraggingRef.current = false
                    setEffortDragging(false)
                    setEffortDragPercent(null)
                    setEffortDraft(index)
                    applyEffortIndex(index)
                  }
                }, typeof level.name === 'string' ? level.name : level.id))
              )
            ) : null,
            openMenu === 'permission' ? h('div', { className: 'wd-menu', role: 'menu' },
              h('div', { className: 'wd-menuTitle' }, '权限'),
              PERMISSION_OPTIONS.map((option) => {
                const active = permissionValue === option.id
                return h('button', {
                  key: option.id,
                  type: 'button',
                  className: 'wd-menuItem',
                  'data-active': active ? 'true' : 'false',
                  onClick: () => choosePermission(option)
                }, h('span', null, option.label), active ? h('span', { className: 'wd-menuCheck' }, '✓') : null)
              }),
              permissionConfirm !== null ? h('div', { className: 'wd-menuWarn' },
                '完全权限会关闭沙箱保护，确认切换吗？',
                h('div', { className: 'wd-menuActions' },
                  h('button', {
                    type: 'button',
                    className: 'wd-menuBtn',
                    onClick: () => {
                      const id = permissionConfirm
                      setPermissionConfirm(null)
                      runPermission(id)
                    }
                  }, '确认切换'),
                  h('button', { type: 'button', className: 'wd-menuBtnGhost', onClick: () => setPermissionConfirm(null) }, '取消')
                )
              ) : null
            ) : null
          )
        ),
        notice !== '' ? h('div', { className: 'wd-notice' }, notice) : null,
        settingsOpen ? h(React.Fragment, null,
          h('div', { className: 'wd-setOverlay', onClick: () => setSettingsOpen(false) }),
          h('section', {
            className: 'wd-setCard',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': '对话框设置',
            tabIndex: -1,
            ref: settingsCardRef,
            onClick: (event) => event.stopPropagation()
          },
            h('div', { className: 'wd-setHead' },
              h('span', { className: 'wd-setTitle' }, '对话框设置'),
              h('button', {
                type: 'button',
                className: 'wd-setClose',
                'aria-label': '关闭设置',
                onClick: () => setSettingsOpen(false)
              }, '×')
            ),
            h(WhaleQuickSettings, {
              settings,
              update: setSettings,
              character,
              onEditCharacter: () => setCharacterOpen(true)
            })
          )
        ) : null,
        characterOpen ? h(React.Fragment, null,
          h('div', { className: 'wd-charOverlay', onClick: () => setCharacterOpen(false) }),
          h('section', {
            className: 'wd-charCard',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': '角色与立绘',
            tabIndex: -1,
            ref: characterCardRef,
            onClick: (event) => event.stopPropagation()
          },
            h('div', { className: 'wd-setHead' },
              h('span', { className: 'wd-setTitle' }, '角色与立绘'),
              h('button', {
                type: 'button',
                className: 'wd-setClose',
                'aria-label': '关闭角色设置',
                onClick: () => setCharacterOpen(false)
              }, '×')
            ),
            h(CharacterEditor, { variant: 'card' })
          )
        ) : null
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        pluginContext = ctx
        seedViewPreference()
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: VIEW_ID,
          order: 20,
          label: '鲸鱼对话'
        }, WhaleDialog))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'whale-dialog',
          order: 40,
          label: '鲸鱼对话'
        }, WhaleSettings))
      }
    }
  }
})
