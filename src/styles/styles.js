// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  STUDYDESK STYLES                                                            │
// │  All CSS styles for the application.                                        │
// │  Includes: variables, layout, components, animations, responsive design.    │
// └──────────────────────────────────────────────────────────────────────────────┘

export const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#F4F1EB;--bg2:#FFFFFF;--bg3:#EDEAE3;--bg4:#E5E1D8;--border:#DDD9D1;--border2:#C4BFB5;--text:#18192B;--text2:#52556E;--text3:#8F93A8;--text4:#C2C5D4;--accent:#5B8DEE;--accent2:#4A7DD9;--card:#FFFFFF;--card2:#F9F7F3;--sh:rgba(24,25,43,.06);--sh2:rgba(24,25,43,.13);--mbg:#F4F1EB;--ibg:#FFFFFF;--sg:linear-gradient(160deg,#FFFFFF,#F5F3EE);--hb:#18192B;--tb:#E8E4DC;--tc:#F5F3ED;--schdr:#5B8DEE;--radius:16px;--sb-bg:#DDE1E8;--sb-text:#1a1a2e;--sb-text2:rgba(26,26,46,.75);--sb-border:rgba(0,0,0,.08);--sb-hover:rgba(0,0,0,.06);--sb-on:rgba(0,0,0,.12);--sb-bottom-border:rgba(0,0,0,.06);--space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;--space-2xl:48px;--fs-xs:.68rem;--fs-sm:.8rem;--fs-md:.9rem;--fs-lg:1.05rem;--fs-xl:1.25rem;--fs-2xl:1.6rem;--fw-medium:500;--fw-semibold:600;--fw-bold:700;--focus-ring:0 0 0 3px rgba(91,141,238,.4);--transition-fast:.12s;--transition-base:.2s;--transition-slow:.3s;--ease-out:cubic-bezier(.16,1,.3,1)}
.dark{--bg:#0B0D14;--bg2:#0F111A;--bg3:#161922;--bg4:#1C1F2B;--border:#252938;--border2:#34394A;--text:#E8EBFA;--text2:#9BA3C6;--text3:#5E6485;--text4:#3D4258;--accent:#7C9AFF;--accent2:#8FAAFF;--card:#12141C;--card2:#161822;--sh:rgba(0,0,0,.4);--sh2:rgba(0,0,0,.6);--mbg:#0B0D14;--ibg:#161922;--sg:linear-gradient(160deg,#161922,#0F111A);--hb:#252938;--tb:#161822;--tc:#14161E;--schdr:#7C9AFF;--radius:16px;--sb-bg:#141823;--sb-text:#E8EBFA;--sb-text2:rgba(232,235,250,.7);--sb-border:rgba(255,255,255,.06);--sb-hover:rgba(255,255,255,.06);--sb-on:rgba(255,255,255,.1);--sb-bottom-border:rgba(255,255,255,.04);--focus-ring:0 0 0 3px rgba(124,154,255,.35)}
/* Custom Scrollbars */
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track{background:var(--bg3);border-radius:10px}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:10px;border:2px solid var(--bg3)}
::-webkit-scrollbar-thumb:hover{background:var(--text4)}
/* Firefox */
*{scrollbar-width:thin;scrollbar-color:var(--border2) var(--bg3)}
*:focus-visible{outline:none;box-shadow:var(--focus-ring)}
button:focus-visible,a:focus-visible,.tab:focus-visible,.sidebar-item:focus-visible,.bnav-btn:focus-visible,.hdr-icon-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);min-height:100vh;color:var(--text);transition:background .25s,color .25s}
/* Toast notifications */
.toast-container{position:fixed;bottom:calc(24px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;align-items:center;max-width:calc(100% - 32px);pointer-events:none}
@media(max-width:768px){.toast-container{bottom:calc(90px + env(safe-area-inset-bottom));max-width:calc(100% - 24px)}}
.toast{display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);box-shadow:0 8px 32px var(--sh2);font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--text);cursor:pointer;pointer-events:auto;transition:transform var(--transition-base) var(--ease-out),opacity var(--transition-base);animation:toastIn .35s var(--ease-out) forwards;max-width:400px}
.toast:hover{transform:scale(1.02)}
.toast-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:800;flex-shrink:0}
.toast--success .toast-icon{background:#d1fae5;color:#059669}
.toast--error .toast-icon{background:#fee2e2;color:#dc2626}
.toast--warning .toast-icon{background:#fef3c7;color:#d97706}
.toast--info .toast-icon{background:rgba(91,141,238,.15);color:var(--accent)}
@keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.dk{background:var(--bg);min-height:100vh;transition:background .25s}
.app{max-width:1080px;margin:0 auto;padding:0 20px 40px}
/* ── SIDEBAR LAYOUT (desktop): fixed full-height, main content scrolls only ── */
@media(min-width:769px){
  .app.has-sidebar{max-width:none;padding:0}
  .sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;height:100vh;height:100dvh;display:flex;flex-direction:column;background:var(--sb-bg);border-right:1px solid var(--sb-border);box-shadow:2px 0 12px rgba(0,0,0,.08);padding-top:max(env(safe-area-inset-top),12px);z-index:100;transition:background .25s,border-color .25s,color .25s}
  .sidebar-logo{display:flex;align-items:center;gap:10px;padding:16px 18px 20px;border-bottom:1px solid var(--sb-bottom-border)}
  .sidebar-logo-img{width:40px;height:40px;border-radius:10px;flex-shrink:0;object-fit:contain;display:block}
  .sidebar-logo-text{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:700;color:var(--sb-text);letter-spacing:-.3px}
  .sidebar-nav{flex:1;padding:14px 10px;overflow-y:auto;min-height:0}
  .sidebar-item{display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;border-radius:10px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--sb-text2);transition:all .18s;text-align:left;margin-bottom:2px}
  .sidebar-item:hover{background:var(--sb-hover);color:var(--sb-text)}
  .sidebar-item.on{background:var(--sb-on);color:var(--sb-text)}
  .sidebar-item svg{flex-shrink:0;opacity:.9}
  .sidebar-item.on svg{opacity:1}
  .sidebar-item-wrap{position:relative}
  .sidebar-more-dropdown{position:absolute;top:100%;left:0;right:0;margin-top:4px;background:var(--sb-bg);border:1px solid var(--sb-border);border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:50}
  .sidebar-more-dropdown button,.sidebar-more-dropdown a{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:var(--sb-text);text-align:left;transition:background .15s;text-decoration:none}
  .sidebar-more-dropdown button:hover,.sidebar-more-dropdown a:hover{background:var(--sb-hover)}
  .sidebar-more-dropdown button:not(:last-child),.sidebar-more-dropdown a:not(:last-child){border-bottom:1px solid var(--sb-bottom-border)}
  .sidebar-bottom{border-top:1px solid var(--sb-bottom-border);padding:14px 10px}
  .sidebar-profile{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:10px;border:none;background:var(--sb-on);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;text-align:left;margin-bottom:10px;transition:all .18s}
  .sidebar-profile:hover{background:var(--sb-hover)}
  .sidebar-profile-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5B8DEE,#7C85FF);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.85rem;flex-shrink:0;overflow:hidden}
  .sidebar-profile-avatar img{width:100%;height:100%;object-fit:cover}
  .sidebar-profile-info{flex:1;min-width:0}
  .sidebar-profile-name{font-size:.82rem;font-weight:700;color:var(--sb-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sidebar-profile-email{font-size:.68rem;color:var(--sb-text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
  .sidebar-dm{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--sb-text2);width:100%;text-align:left;margin-bottom:6px;transition:all .18s}
  .sidebar-dm:hover{background:var(--sb-hover);color:var(--sb-text)}
  .sidebar-dm-toggle{width:42px;height:24px;border-radius:12px;background:var(--sb-on);margin-left:auto;position:relative;transition:background .2s;flex-shrink:0}
  .sidebar-dm-toggle.on{background:#5B8DEE}
  .sidebar-dm-knob{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.25)}
  .sidebar-dm-toggle.on .sidebar-dm-knob{transform:translateX(18px)}
  .sidebar-logout{display:flex;align-items:center;gap:12px;width:100%;padding:11px 14px;border-radius:10px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--sb-text);background:var(--sb-on);text-align:left;transition:all .18s;margin-top:4px}
  .sidebar-logout:hover{background:var(--sb-hover)}
  .sidebar-user-menu{background:var(--sb-bg);border:1px solid var(--sb-border);border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.2);margin-bottom:10px}
  .sidebar-user-menu .sidebar-profile-email{color:var(--sb-text2);padding:8px 14px;font-size:.7rem;border-bottom:1px solid var(--sb-bottom-border)}
  .sidebar-user-menu .sidebar-signout{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:transparent;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:#f87171;text-align:left;transition:background .15s}
  .sidebar-user-menu .sidebar-signout:hover{background:rgba(248,113,113,.15)}
  .main-wrap{margin-left:260px;min-height:100vh;height:100vh;height:100dvh;overflow-y:auto;display:flex;flex-direction:column}
  .main-inner{max-width:1080px;margin:0 auto;width:100%;padding:0 32px 32px;flex:1;padding-top:max(env(safe-area-inset-top),20px);padding-left:max(env(safe-area-inset-left),32px);padding-right:max(env(safe-area-inset-right),32px)}
  .app.has-sidebar .tabs{display:none}
  .app.has-sidebar .hdr{padding:max(env(safe-area-inset-top),20px) 0 16px;margin-bottom:20px;gap:8px;margin-left:32px}
  .app.has-sidebar .hdr-title{font-size:1.5rem}
  .app.has-sidebar .hdr-sub{font-size:.7rem;margin-top:2px}
  .app.has-sidebar .hdr-r{gap:6px;flex-shrink:0}
  .app.has-sidebar .hdr .streak-pill,.app.has-sidebar .hdr .pts-pill{font-size:.72rem;padding:4px 10px}
  .app.has-sidebar .btn-sm{padding:4px 10px;font-size:.72rem}
  .app.has-sidebar .hdr-icon-btn{width:32px;height:32px;font-size:.8rem}
}
@media(max-width:768px){
  .sidebar{display:none!important}
  .main-inner{padding:0}
}
.hdr{padding:max(env(safe-area-inset-top),16px) 0 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--border);margin-bottom:24px;gap:12px;flex-wrap:wrap}
.hdr-title{font-family:'Fraunces',serif;font-size:1.85rem;font-weight:700;color:var(--text);letter-spacing:-.5px;line-height:1}
.hdr-sub{font-size:.75rem;color:var(--text3);margin-top:3px;font-weight:500}
.hdr-hint{font-size:.68rem;color:var(--text4);margin-top:4px;font-weight:500;opacity:.7}
.hdr-hint kbd{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-family:monospace;font-size:.7em;margin:0 2px}
.hdr-r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.hdr-icon-btn{min-width:44px;min-height:44px;width:44px;height:44px;border-radius:12px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:var(--text2);transition:all var(--transition-base);position:relative;flex-shrink:0}
.hdr-icon-btn:hover{background:var(--bg3);border-color:var(--border2);color:var(--text)}
.hdr-icon-btn .notif-dot{position:absolute;top:-3px;right:-3px;width:7px;height:7px;background:#ef4444;border-radius:50%;border:1.5px solid var(--bg)}
.dm-btn{width:44px;height:26px;border-radius:13px;border:1.5px solid var(--border2);background:var(--bg3);cursor:pointer;position:relative;transition:all .2s;flex-shrink:0;padding:0}
.dm-knob{width:20px;height:20px;border-radius:50%;background:var(--text2);position:absolute;top:2px;left:2px;transition:transform .2s;display:flex;align-items:center;justify-content:center;font-size:.65rem;line-height:1}
.dark .dm-knob{transform:translateX(18px)}
.tabs{display:flex;gap:2px;margin-bottom:22px;background:var(--tb);padding:3px;border-radius:14px;width:fit-content;overflow-x:auto;max-width:100%;scrollbar-width:none;position:relative}
.tabs::-webkit-scrollbar{display:none}
.tabs::after{content:'';position:absolute;right:0;top:0;bottom:0;width:40px;background:linear-gradient(90deg,transparent,var(--tb));pointer-events:none;border-radius:0 14px 14px 0}
@media(max-width:768px){.tabs::after{display:block}}
.tab{padding:7px 15px;border-radius:11px;border:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .12s;white-space:nowrap;letter-spacing:.01em}
.tab:hover:not(.on){background:var(--bg4);color:var(--text2)}
.tab.on{background:var(--card);color:var(--text);box-shadow:0 1px 6px var(--sh2),0 0 0 1px var(--border)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px}
.stat{background:linear-gradient(135deg,var(--card),var(--card2));border-radius:18px;padding:18px 18px 15px;border:1.5px solid var(--border);position:relative;overflow:hidden;transition:transform var(--transition-base) var(--ease-out),box-shadow var(--transition-base);cursor:default}
.stat:hover{transform:translateY(-3px);box-shadow:0 12px 32px var(--sh2)}
.sacc{position:absolute;top:0;left:0;right:0;height:4px;border-radius:18px 18px 0 0;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.stat-n{font-family:'Fraunces',serif;font-size:1.9rem;font-weight:700;color:var(--text);line-height:1;margin-top:4px}
.stat-l{font-size:.68rem;color:var(--text3);margin-top:5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
.stat-ico{position:absolute;right:12px;top:12px;font-size:1.4rem;opacity:.25}
.sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.sec-t{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:600;color:var(--text)}
.sec-lbl{font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.alist{display:flex;flex-direction:column;gap:8px}
.acard{background:var(--card);border-radius:14px;padding:15px 17px;border:1.5px solid var(--border);display:flex;align-items:center;gap:12px;transition:transform var(--transition-fast),box-shadow var(--transition-base),border-color var(--transition-fast);flex-wrap:wrap;transform-origin:center}
.acard:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--sh);border-color:var(--border2)}
.acard:active{transform:translateY(0) scale(.99)}
.acard.ov{border-color:#ef4444;background:#fef2f2;border-width:2px;box-shadow:0 0 0 3px rgba(239,68,68,.15)}
.dark .acard.ov{border-color:#dc2626;background:#1c0000;box-shadow:0 0 0 3px rgba(220,38,38,.2)}
.stripe{width:5px;border-radius:5px;align-self:stretch;min-height:40px;flex-shrink:0}
.amain{flex:1;min-width:0}
.atitle{font-weight:700;color:var(--text);font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px;line-height:1.3}
.ameta{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.mtag{font-size:.72rem;font-weight:700}
.ppill{font-size:.66rem;font-weight:700;padding:2px 8px;border-radius:20px}
.dbadge{font-size:.71rem;font-weight:700}
.pbar-wrap{width:100px;flex-shrink:0}
.pbar-track{height:8px;background:var(--bg3);border-radius:5px;overflow:hidden}
.pbar-fill{height:100%;border-radius:5px;transition:width .4s ease}
.plabel{font-size:.7rem;color:var(--text2);text-align:right;margin-top:3px;font-weight:700}
.qbtns{display:flex;gap:3px;margin-top:7px}
.qbtn{font-size:.65rem;padding:3px 7px;border-radius:6px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;color:var(--text3);font-weight:700;transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.qbtn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.qbtn:hover:not(.on){background:var(--bg3);color:var(--text)}
.ibtn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.75rem;background:transparent;color:var(--text4);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.ibtn:hover{background:#fef2f2;color:#dc2626}
.dark .ibtn:hover{background:#350000;color:#ff7070}
.sfilt{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.sfbtn{padding:5px 13px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:.75rem;font-weight:600;cursor:pointer;color:var(--text2);transition:all .12s;font-family:'Plus Jakarta Sans',sans-serif}
.sfbtn:hover{background:var(--bg3);color:var(--text)}
.btn{padding:8px 15px;border-radius:10px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.81rem;transition:all .12s;display:inline-flex;align-items:center;gap:5px;letter-spacing:.01em}
.btn-p{background:var(--accent);color:#fff;box-shadow:0 1px 4px var(--sh)}
.btn-p:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 14px var(--sh2)}
.btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{background:var(--bg3);color:var(--text);border-color:var(--border2)}
.btn-sm{padding:5px 11px;font-size:.75rem;border-radius:8px}
.overlay{position:fixed;inset:0;background:rgba(8,10,18,.55);backdrop-filter:blur(8px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:460px;max-height:min(92vh,92dvh);overflow-y:auto;border:1.5px solid var(--border);box-shadow:0 20px 60px var(--sh2)}
.modal-t{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:700;color:var(--text);margin-bottom:18px}
.fg{margin-bottom:12px}
.flbl{display:block;font-size:.67rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
.finp,.fsel,.ftxt{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;background:var(--ibg);color:var(--text);outline:none;transition:border-color .15s,box-shadow .15s}
.finp:focus,.fsel:focus,.ftxt:focus{border-color:var(--accent);box-shadow:var(--focus-ring)}
.ftxt{resize:vertical;min-height:60px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.range{width:100%;accent-color:var(--accent)}
.mactions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
@media(max-width:768px){.mactions{position:sticky;bottom:0;background:var(--mbg);padding:12px 0 4px;margin-top:12px;border-top:1.5px solid var(--border)}}
.dtoggle{padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);cursor:pointer;font-size:.76rem;font-weight:600;background:var(--card);color:var(--text2);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.dtoggle.on{border-color:var(--accent);background:var(--accent);color:#fff}
.dtogglerow{display:flex;gap:5px;flex-wrap:wrap}
.swatches{display:flex;gap:7px;flex-wrap:wrap}
.swatch{width:26px;height:26px;border-radius:50%;cursor:pointer;border:2.5px solid transparent;transition:transform .1s}
.swatch.on{border-color:var(--text);transform:scale(1.18)}
.sched-layout{display:grid;grid-template-columns:270px 1fr;gap:18px;align-items:start}
.sc-classes{display:flex;flex-direction:column;gap:8px}
.sc-card{background:var(--card);border-radius:14px;padding:13px 15px;border:1.5px solid var(--border);display:flex;align-items:center;gap:11px;transition:box-shadow .15s}
.sc-card:hover{box-shadow:0 4px 16px var(--sh)}
.sc-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
.sc-name{font-weight:700;color:var(--text);font-size:.88rem}
.sc-meta{font-size:.72rem;color:var(--text3);margin-top:2px;line-height:1.4}
.sc-badge{font-size:.66rem;font-weight:700;color:inherit;margin-top:2px}
.sgrid{background:var(--card);border-radius:16px;border:1.5px solid var(--border);overflow:auto;box-shadow:0 2px 12px var(--sh)}
.shdr{display:grid;grid-template-columns:48px repeat(7,1fr);background:linear-gradient(135deg,var(--schdr),var(--accent2));color:#fff;min-width:520px;border-radius:14px 14px 0 0;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.shcell{padding:12px 4px;text-align:center;font-size:.75rem;font-weight:700;letter-spacing:.05em}
.shcell.tdy{background:rgba(255,255,255,.2);font-weight:800}
.sgrid-body{display:grid;grid-template-columns:48px repeat(7,1fr);min-width:520px;position:relative}
.sgrid-times{display:flex;flex-direction:column}
.stime-row{height:52px;padding:4px 6px 0 0;font-size:.62rem;color:var(--text4);text-align:right;font-weight:600;border-top:1px solid var(--border);box-sizing:border-box}
.sgrid-daycol{position:relative;border-left:1px solid var(--border)}
.sgrid-daycol.tdy{background:var(--tc)}
.sgrid-hrline{position:absolute;left:0;right:0;border-top:1px solid var(--border);pointer-events:none}
.cblock{position:absolute;left:2px;right:2px;border-radius:6px;padding:3px 5px;font-size:.64rem;font-weight:700;color:#fff;display:flex;flex-direction:column;justify-content:center;line-height:1.3;overflow:hidden;box-sizing:border-box;z-index:1}
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.dcard{background:var(--card);border:1.5px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:0 2px 12px var(--sh)}
.dcard-hdr{padding:13px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:9px}
.dcard-title{font-family:'Fraunces',serif;font-size:1rem;font-weight:600;color:var(--text)}
.dcard-body{padding:10px 12px;display:flex;flex-direction:column;gap:7px;max-height:340px;overflow-y:auto}
.cacard{background:var(--bg3);border-radius:11px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:background .12s}
.cacard:hover{background:var(--bg4)}
.castripe{width:4px;border-radius:4px;align-self:stretch;min-height:30px;flex-shrink:0}
.catitle{font-weight:700;font-size:.86rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cadue{font-size:.7rem;font-weight:700;white-space:nowrap}
.tccard{display:flex;align-items:center;gap:10px;background:var(--bg3);border-radius:11px;padding:10px 12px}
.tcdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tcname{font-weight:700;color:var(--text);font-size:.86rem}
.tctime{font-size:.72rem;color:var(--text3);margin-left:auto;white-space:nowrap;font-weight:700;text-align:right;line-height:1.4}
.tcroom{font-size:.68rem;color:var(--text4);margin-top:1px}
.pts-pill{display:inline-flex;align-items:center;gap:5px;background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:20px;padding:5px 12px;font-size:.78rem;font-weight:700;color:#D97706}
.dark .pts-pill{background:#231800;border-color:#8A5000;color:#F59E0B}
.streak-pill{display:inline-flex;align-items:center;gap:5px;background:#FFF7F0;border:1.5px solid #FDDCB5;border-radius:20px;padding:5px 12px;font-size:.78rem;font-weight:700;color:#EA580C}
.dark .streak-pill{background:#200E00;border-color:#7A3000;color:#FB923C}
.pts-float{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);pointer-events:none;font-size:1.6rem;font-weight:900;animation:ptsFly 1.8s ease-out forwards;z-index:9999;text-shadow:0 2px 12px rgba(0,0,0,.2)}
@keyframes ptsFly{0%{opacity:1;transform:translate(-50%,-50%) scale(1.4)}100%{opacity:0;transform:translate(-50%,-200%) scale(.8)}}
.confetti-piece{position:fixed;pointer-events:none;z-index:9998;border-radius:3px;animation:confettiFall var(--dur,1.4s) ease-out forwards}
@keyframes confettiFall{0%{opacity:1;transform:translate(0,0) rotate(0deg) scale(1)}100%{opacity:0;transform:translate(var(--tx,0px),var(--ty,320px)) rotate(var(--rot,480deg)) scale(.4)}}
.submit-btn{padding:6px 13px;border-radius:9px;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.74rem;background:#16a34a;color:#fff;box-shadow:0 0 10px rgba(22,163,74,.5),0 0 20px rgba(22,163,74,.25);transition:all .18s;white-space:nowrap;flex-shrink:0}
.submit-btn:hover{background:#15803d;box-shadow:0 0 16px rgba(22,163,74,.7),0 0 32px rgba(22,163,74,.35);transform:translateY(-1px) scale(1.04)}
.submit-btn:active{transform:scale(.97)}
.submit-btn.done{background:#15803d;box-shadow:none;cursor:default;opacity:.7}
.submit-btn.compact{padding:4px 9px;font-size:.68rem;border-radius:7px;box-shadow:0 0 8px rgba(22,163,74,.45),0 0 14px rgba(22,163,74,.2)}
.quest-strip{background:linear-gradient(135deg,#FFFBEB,#FFF8D6);border:1.5px solid #FDE68A;border-radius:14px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:center;gap:14px}
.dark .quest-strip{background:linear-gradient(135deg,#221600,#1A1200);border-color:#6A3800}
.qpip{width:34px;height:34px;border-radius:50%;border:2.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:.9rem;background:var(--card);transition:all .3s}
.qpip.lit{background:#F59E0B;border-color:#F59E0B;box-shadow:0 2px 10px rgba(245,158,11,.4);color:#fff}
.buddy-wrap{display:flex;justify-content:center;margin:0 auto 4px;width:180px;height:200px}
.buddy-bounce{animation:bBounce 2.8s ease-in-out infinite}
@keyframes bBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.buddy-shell{background:var(--card);border:1.5px solid var(--border);border-radius:20px;padding:20px;margin-bottom:16px;text-align:center;position:relative;overflow:hidden}
.buddy-shell::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(91,141,238,.08) 0%,transparent 70%);animation:buddyGlow 4s ease-in-out infinite;pointer-events:none}
@keyframes buddyGlow{0%,100%{transform:translate(0,0) scale(1);opacity:.6}50%{transform:translate(10px,-10px) scale(1.1);opacity:.9}}
.buddy-stage-name{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:700;color:var(--text);margin-bottom:3px}
.buddy-stage-desc{font-size:.76rem;color:var(--text3);margin-bottom:14px}
.bpbar{height:8px;background:var(--bg3);border-radius:6px;overflow:hidden;margin:10px 0 5px}
.bpfill{height:100%;border-radius:6px;background:linear-gradient(90deg,#f5a623,#ffd060);transition:width .6s}
.bplbl{display:flex;justify-content:space-between;font-size:.68rem;color:var(--text4);font-weight:600;margin-bottom:14px}
.quest-card{background:linear-gradient(135deg,#FFFBEB,#FFF8D6);border:1.5px solid #FDE68A;border-radius:16px;padding:16px 18px;margin-bottom:14px}
.dark .quest-card{background:linear-gradient(135deg,#221600,#1A1200);border-color:#6A3800}
.quest-title{font-size:.68rem;font-weight:800;color:#D97706;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
.quest-text{font-size:.86rem;font-weight:600;color:var(--text);margin-bottom:12px}
.quest-pips{display:flex;gap:10px;align-items:center}
.quest-pip{width:42px;height:42px;border-radius:50%;border:2.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:var(--card);transition:all .3s;font-weight:700}
.quest-pip.lit{background:#F59E0B;border-color:#F59E0B;box-shadow:0 2px 12px rgba(245,158,11,.4)}
.bstat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.pts-how{background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:14px}
.pts-how-row{display:flex;justify-content:space-between;font-size:.82rem;align-items:center;padding:4px 0;color:var(--text2)}
.pts-how-amt{font-weight:700;color:#F59E0B;white-space:nowrap}
.shop-filter{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.shop-card{background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:18px 14px 14px;text-align:center;transition:transform .18s,box-shadow .18s;position:relative}
.shop-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px var(--sh2)}
.shop-card.owned{border-color:#BBF7D0;background:#F0FDF4}
.dark .shop-card.owned{border-color:#166534;background:#001508}
.shop-card.equipped{border-color:var(--accent);box-shadow:0 0 0 3px var(--sh2)}
.shop-badge{position:absolute;top:8px;right:8px;font-size:.58rem;font-weight:800;padding:2px 7px;border-radius:20px;color:#fff}
.shop-icon{font-size:2.6rem;margin-bottom:8px;display:block;line-height:1}
.shop-name{font-size:.84rem;font-weight:700;color:var(--text);margin-bottom:1px}
.shop-cat{font-size:.63rem;color:var(--text4);text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:4px}
.shop-desc{font-size:.73rem;color:var(--text3);margin-bottom:10px;line-height:1.4}
.eq-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px;min-height:20px}
.eq-chip{background:var(--bg3);border-radius:20px;padding:3px 10px;font-size:.72rem;font-weight:600;color:var(--text3)}

/* Full-page Release Notes */
.releases-fullpage{position:fixed;inset:0;background:var(--bg);z-index:300;display:flex;flex-direction:column;overflow:hidden}
.releases-header{background:var(--mbg);border-bottom:2px solid var(--border);padding:0;position:sticky;top:0;z-index:10;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.releases-header-content{max-width:1000px;margin:0 auto;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.releases-main-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.75rem;font-weight:800;color:var(--text);margin:0;letter-spacing:-.02em}
.releases-subtitle{font-size:.9rem;color:var(--text3);margin:6px 0 0;font-weight:500}
.releases-close-btn{background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;color:var(--text2);flex-shrink:0}
.releases-close-btn:hover{background:var(--bg4);border-color:var(--accent);color:var(--accent);transform:scale(1.05)}
.releases-content{flex:1;overflow-y:auto;padding:40px 32px}
.releases-container{max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
.release-card{background:var(--mbg);border:2px solid var(--border);border-radius:20px;padding:28px 32px;transition:all .3s ease}
.release-card:hover{border-color:var(--accent);box-shadow:0 8px 24px rgba(91,141,238,.12);transform:translateY(-2px)}
.release-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px}
.release-version-info{display:flex;align-items:center;gap:10px}
.release-version-badge{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:.8rem;font-weight:700;padding:6px 14px;border-radius:20px;letter-spacing:.02em}
.release-latest-badge{background:var(--bg3);color:var(--accent);font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:16px;border:1.5px solid var(--accent)}
.release-date-text{font-size:.85rem;color:var(--text3);font-weight:600}
.release-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.35rem;font-weight:700;color:var(--text);margin:0 0 20px;line-height:1.3;letter-spacing:-.01em}
.release-changes-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px}
.release-change-item{display:flex;align-items:flex-start;gap:12px;font-size:.92rem;color:var(--text2);line-height:1.6;padding-left:24px;position:relative}
.release-change-item::before{content:'';position:absolute;left:0;top:10px;width:8px;height:8px;background:var(--accent);border-radius:50%;box-shadow:0 0 0 3px rgba(91,141,238,.15)}

/* Old release styles - keep for backward compatibility */
.release-overlay{position:fixed;inset:0;background:rgba(8,10,18,.62);backdrop-filter:blur(6px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
.release-box{background:var(--mbg);border-radius:22px;width:100%;max-width:520px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px var(--sh2);border:1.5px solid var(--border)}
.release-hd{padding:22px 24px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.release-title{font-family:'Fraunces',serif;font-size:1.35rem;font-weight:700;color:var(--text)}
.release-sub{font-size:.74rem;color:var(--text3);margin-top:3px}
.release-body{overflow-y:auto;padding:20px 24px;flex:1}
.release-entry{margin-bottom:24px}
.release-entry:last-child{margin-bottom:0}
.release-ver{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px}
.release-badge{background:var(--accent);color:#fff;font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px}
.release-date{font-size:.72rem;color:var(--text3);font-weight:500}
.release-name{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:8px}
.release-changes{display:flex;flex-direction:column;gap:5px}
.release-change{display:flex;gap:8px;font-size:.8rem;color:var(--text2);line-height:1.5}
.release-dot{color:#f5a623;font-size:.9rem;flex-shrink:0;margin-top:1px}

.about-body{padding:24px;overflow-y:auto;flex:1}
.about-hero{text-align:center;padding:8px 0 20px}
.about-logo{width:64px;height:64px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 12px}
.about-name{font-family:'Fraunces',serif;font-size:1.6rem;font-weight:700;color:var(--text)}
.about-tagline{font-size:.82rem;color:var(--text3);margin-top:4px}
.about-section{margin-bottom:20px}
.about-section-title{font-size:.7rem;font-weight:700;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.about-card{background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;font-size:.82rem;color:var(--text2);line-height:1.7}
.about-feature{display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border)}
.about-feature:last-child{border-bottom:none}
.about-feature-icon{font-size:1rem;flex-shrink:0;margin-top:1px}
.about-feature-text{font-size:.8rem;color:var(--text2);line-height:1.5}
.about-feature-text b{color:var(--text)}
.about-made{text-align:center;padding:16px 0 4px;font-size:.78rem;color:var(--text4)}
.about-made span{color:var(--text);font-weight:700}
.import-step{display:flex;align-items:flex-start;gap:9px;margin-bottom:11px}
.import-num{width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.import-txt{font-size:.81rem;color:var(--text2);line-height:1.5}
.import-txt b{color:var(--text)}
.apreview{border:1.5px solid var(--border);border-radius:13px;overflow:hidden;margin-top:10px}
.apreview-hd{background:var(--accent);color:#fff;padding:8px 13px;font-size:.76rem;font-weight:600}
.apreview-list{max-height:210px;overflow-y:auto}
.apreview-item{display:flex;align-items:center;gap:8px;padding:8px 13px;border-bottom:1px solid var(--border)}
.apreview-item:last-child{border-bottom:none}
.apreview-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.apreview-name{font-size:.83rem;font-weight:600;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apreview-due{font-size:.7rem;color:var(--text3);white-space:nowrap}
.spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.cv-spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
/* Loading skeletons */
.skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.8s ease-in-out infinite;border-radius:var(--radius);border:none}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skeleton-card{height:88px;margin-bottom:10px;border-radius:14px}
.skeleton-stat{height:110px;border-radius:18px}
.skeleton-stat-lg{height:140px;border-radius:20px}
.skeleton-row{display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:8px;border-radius:14px}
.skeleton-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0}
.skeleton-line{height:14px;border-radius:7px}
.skeleton-line-sm{height:10px;border-radius:5px;width:60%}
.skeleton-pulse{animation:skeleton-pulse 1.5s ease-in-out infinite}
@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.6}}
.err-box{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#dc2626;margin-top:8px;line-height:1.5}
.dark .err-box{background:#1c0000;border-color:#7f1d1d;color:#ff8080}
.success-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#16a34a;margin-top:6px;font-weight:600}
.dark .success-box{background:#001500;border-color:#166534;color:#4ade80}
.loading-box{display:flex;flex-direction:column;align-items:center;padding:30px;gap:12px;color:var(--text3)}
.loading-box p{font-size:.82rem;text-align:center;max-width:260px;line-height:1.5;color:var(--text2)}
.itabs{display:flex;gap:4px;background:var(--bg3);padding:4px;border-radius:11px;margin-bottom:16px}
.itab{flex:1;padding:7px 0;border-radius:8px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .15s;background:transparent}
.itab.on{background:var(--accent);color:#fff}
.itab.canvas-on{background:#4338ca;color:#fff}
.itab.agenda-on{background:#ea580c;color:#fff}
.empty{text-align:center;padding:42px 20px;color:var(--text4)}
.empty-i{font-size:2.2rem;margin-bottom:10px}
.empty-t{font-family:'Fraunces',serif;font-size:1rem;color:var(--text4)}
.empty-state{text-align:center;padding:48px 24px;background:var(--card);border:1.5px dashed var(--border2);border-radius:20px;max-width:360px;margin:0 auto}
.empty-state-icon{font-size:3rem;margin-bottom:16px;opacity:.9;line-height:1}
.empty-state-title{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:700;color:var(--text);margin:0 0 8px;letter-spacing:-.3px}
.empty-state-desc{font-size:var(--fs-sm);color:var(--text3);line-height:1.6;margin:0 0 20px;max-width:260px;margin-left:auto;margin-right:auto}
.empty-state-cta{margin-top:4px}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.tclass{display:flex;flex-direction:column;gap:7px}
.clsrow{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px}
.clstag{display:flex;align-items:center;gap:5px;padding:4px 10px;background:var(--card);border-radius:9px;border:1.5px solid var(--border)}
.prompt-overlay{position:fixed;inset:0;background:rgba(8,10,18,.6);backdrop-filter:blur(6px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px}
.prompt-modal{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:420px;border:1.5px solid var(--border);box-shadow:0 20px 50px var(--sh2)}
@media(max-width:800px){.sched-layout{grid-template-columns:1fr}.dash-grid{grid-template-columns:1fr}.hdr-title{font-size:1.6rem}.frow{grid-template-columns:1fr}.stats{grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}}
/* ── MOBILE BOTTOM NAV ── */
.mob-content{padding:0}
.bnav{display:none}
.mob-hdr{display:none}.mob-status{display:none}
.mob-icon-btn{width:36px;height:36px;border-radius:50%;border:none;background:var(--bg3);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);transition:all .15s;-webkit-tap-highlight-color:transparent;flex-shrink:0}
.mob-icon-btn:active{background:var(--bg4);transform:scale(.93)}
/* ── FLOATING ACTION BUTTON ── */
.fab{position:fixed;bottom:calc(80px + env(safe-area-inset-bottom));right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 4px 20px rgba(91,141,238,.4),0 8px 40px rgba(91,141,238,.2);z-index:150;transition:all .15s;-webkit-tap-highlight-color:transparent}
.fab:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 6px 28px rgba(91,141,238,.5),0 12px 48px rgba(91,141,238,.25)}
.fab:active{transform:scale(.92)}
@media(min-width:769px){.fab{display:flex;bottom:32px;right:32px}}
@media(max-width:768px){.fab{display:flex}}
@media(max-width:768px){
  .app{padding:0 0 88px}
  .tabs{display:none}
  /* Show mobile header, hide desktop */
  .hdr{display:none}
  .mob-status{display:flex;}
  .mob-hdr{display:flex;align-items:center;justify-content:space-between;padding:max(env(safe-area-inset-top),14px) 20px 12px;position:sticky;top:0;z-index:50;background:var(--bg);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .mob-hdr-title{font-family:'Fraunces',serif;font-size:1.4rem;font-weight:700;color:var(--text);letter-spacing:-.4px}
  .mob-hdr-date{font-size:.68rem;color:var(--text3);margin-top:2px;font-weight:600}
  .mob-hdr-r{display:flex;align-items:center;gap:10px}
  .mob-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6366f1);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.85rem;overflow:hidden;flex-shrink:0;cursor:pointer;border:2.5px solid var(--bg);box-shadow:0 2px 8px rgba(0,0,0,.15);-webkit-tap-highlight-color:transparent}
  .mob-avatar:active{transform:scale(.92)}
  /* Mobile user menu */
  .mob-user-menu{position:fixed;top:calc(max(env(safe-area-inset-top),14px) + 60px);right:20px;background:var(--mbg);border:1.5px solid var(--border);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:50;min-width:200px;overflow:hidden;animation:slideDown .2s cubic-bezier(.16,1,.3,1)}
  .mob-user-menu-email{padding:12px 16px;font-size:.8rem;color:var(--text3);border-bottom:1px solid var(--border);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mob-user-menu-signout{width:100%;padding:12px 16px;background:none;border:none;display:flex;align-items:center;gap:10px;font-size:.85rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;font-family:inherit}
  .mob-user-menu-signout:active{background:var(--bg3);color:var(--text)}
  .mob-user-menu-signout svg{flex-shrink:0}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  /* Status strip - modern pill design */
  .mob-status{display:flex;align-items:center;gap:8px;padding:10px 20px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--border);background:var(--bg)}
  .mob-status::-webkit-scrollbar{display:none}
  .mob-pill{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:24px;border:none;background:var(--card);font-size:.75rem;font-weight:700;color:var(--text2);white-space:nowrap;cursor:pointer;flex-shrink:0;-webkit-tap-highlight-color:transparent;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:all .15s}
  .mob-pill:active{transform:scale(.95);opacity:.85}
  .mob-pill.fire{background:linear-gradient(135deg,#FFF7F0,#FFECD9);color:#EA580C;box-shadow:0 2px 6px rgba(234,88,12,.2)}
  .mob-pill.star{background:linear-gradient(135deg,#FFFBEB,#FFF4D1);color:#D97706;box-shadow:0 2px 6px rgba(217,119,6,.2)}
  .mob-pill.canvas{background:linear-gradient(135deg,#eef2ff,#ddd6fe);color:#4338ca;box-shadow:0 2px 6px rgba(67,56,202,.2)}
  .mob-pill.err{background:linear-gradient(135deg,#fef2f2,#fee2e2);color:#dc2626;box-shadow:0 2px 6px rgba(220,38,38,.2)}
  .mob-pill.ok{background:linear-gradient(135deg,#f0fdf4,#dcfce7);color:#16a34a;box-shadow:0 2px 6px rgba(22,163,74,.2)}
  .dark .mob-pill.fire{background:linear-gradient(135deg,#200E00,#2A1200);color:#FB923C}
  .dark .mob-pill.star{background:linear-gradient(135deg,#231800,#2D1E00);color:#F59E0B}
  .dark .mob-pill.canvas{background:linear-gradient(135deg,#1e1b4b,#2e1065);color:#a5b4fc}
  .dark .mob-pill{background:var(--card);color:var(--text2)}
  /* Page padding - more breathing room */
  .mob-content{padding:18px 20px calc(100px + env(safe-area-inset-bottom))}
  /* Content area */
  .tab-content,.sfilt,.sec-hd,.alist,.stats,.sec-lbl,.empty,.twocol{padding-left:0;padding-right:0}
  /* Bottom nav - modern iOS style */
  .bnav{display:flex;position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.85);border-top:1px solid var(--border);z-index:200;padding:6px 0 calc(6px + env(safe-area-inset-bottom));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 -2px 12px rgba(0,0,0,.04)}
  .dark .bnav{background:rgba(19,21,31,.9)}
  .bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px;min-height:56px;justify-content:center;background:none;border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.6rem;font-weight:700;color:var(--text4);transition:all .2s;-webkit-tap-highlight-color:transparent;letter-spacing:.02em;text-transform:uppercase}
  .bnav-btn:active{transform:scale(.9)}
  .bnav-btn.on{color:var(--accent)}
  .bnav-ico{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:12px;transition:all .2s;font-size:0;position:relative}
  .bnav-btn.on .bnav-ico{background:var(--accent);transform:translateY(-2px);box-shadow:0 4px 12px rgba(91,141,238,.3)}
  .bnav-btn.on .bnav-ico svg{color:#fff}
  /* Modals as bottom sheets - smoother */
  .modal{padding:0 22px calc(26px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;max-height:min(92vh,92dvh);position:fixed;bottom:0;left:0;right:0;width:100%;max-width:100%;box-shadow:0 -8px 40px rgba(0,0,0,.12);overflow-y:auto;animation:slideUpModal .3s cubic-bezier(.34,1.56,.64,1)}
  @keyframes slideUpModal{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
  .modal::before{content:'';display:block;width:40px;height:4px;border-radius:2px;background:var(--border2);margin:14px auto 18px;flex-shrink:0}
  .overlay{align-items:flex-end;padding:0;background:rgba(8,10,18,.65)}
  /* Cards - more modern */
  .acard{padding:16px 17px;border-radius:16px;gap:12px;align-items:flex-start;box-shadow:0 1px 3px rgba(0,0,0,.06);border-width:1px}
  .acard:active{transform:scale(.98);opacity:.9}
  .acard .amain{flex:1 1 100%;min-width:0}
  .atitle{font-size:.98rem;margin-bottom:6px}
  .pbar-wrap{width:100%;order:10;flex-basis:100%;margin-top:4px}
  .pbar-track{height:6px;border-radius:3px}
  .stat{padding:16px 15px 13px;border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,.06);border-width:1px}
  .stats{grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .stat-n{font-size:1.6rem}
  .stat-l{font-size:.64rem}
  .stat-ico{font-size:1.1rem;right:11px;top:11px}
  /* Buttons - larger tap targets */
  .btn{padding:13px 18px;font-size:.88rem;border-radius:14px;min-height:48px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .btn:active{transform:scale(.96)}
  .btn-sm{padding:10px 15px;font-size:.8rem;border-radius:11px;min-height:42px}
  .btn-p{box-shadow:0 2px 8px rgba(91,141,238,.3)}
  /* Inputs - better mobile UX */
  .finp,.fsel,.ftxt{font-size:16px;padding:13px 15px;min-height:48px;border-radius:12px;border-width:1px}
  .finp:focus,.fsel:focus,.ftxt:focus{border-width:2px;padding:12px 14px}
  /* Section headers */
  .sec-t{font-size:1.12rem}
  .sec-hd{margin-bottom:16px}
  .sec-lbl{font-size:.68rem;margin-bottom:12px}
  /* Grid fixes */
  .twocol{grid-template-columns:1fr}
  .sched-layout{grid-template-columns:1fr}
  .frow{grid-template-columns:1fr}
  /* Subject filter pills */
  .sfilt{gap:8px;margin-bottom:16px}
  .sfbtn{padding:7px 15px;border-radius:24px;font-size:.77rem;border:none;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .sfbtn:active{transform:scale(.95)}
  /* Quick buttons on cards */
  .qbtns{gap:4px;margin-top:8px}
  .qbtn{font-size:.68rem;padding:4px 9px;border-radius:8px;border:none;box-shadow:0 1px 2px rgba(0,0,0,.06)}
  .qbtn:active{transform:scale(.92)}
  /* Submit button */
  .submit-btn{padding:7px 15px;border-radius:11px;font-size:.76rem;box-shadow:0 2px 8px rgba(22,163,74,.35)}
  .submit-btn:active{transform:scale(.94)}
  /* Empty states */
  .empty{padding:48px 20px;border-radius:20px}
  .empty-i{font-size:2.8rem;margin-bottom:12px}
  .empty-t{font-size:1.05rem}
  /* Modal title */
  .modal-t{font-size:1.3rem;margin-bottom:20px}
  /* Dashboard cards */
  .dcard{border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-width:1px}
  .dcard-hdr{padding:15px 18px}
  .dcard-title{font-size:1.05rem}
  .dcard-body{padding:12px 14px}
  /* Today's classes */
  .tccard{padding:12px 14px;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .tcname{font-size:.9rem}
  .tctime{font-size:.74rem}
  /* Compact assignment cards */
  .cacard{padding:11px 13px;border-radius:13px}
  .catitle{font-size:.88rem}
  /* Schedule */
  .sc-card{padding:14px 16px;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);border-width:1px}
  .sc-name{font-size:.9rem}
  /* Buddy */
  .buddy-shell{border-radius:24px;padding:24px;border-width:1px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .buddy-stage-name{font-size:1.4rem}
  /* Quest card */
  .quest-card{border-radius:20px;padding:18px 20px;border:none;box-shadow:0 2px 8px rgba(245,158,11,.2)}
  /* Shop */
  .shop-card{padding:20px 16px 16px;border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,.06);border-width:1px}
  .shop-card:active{transform:scale(.96)}
  .shop-icon{font-size:2.8rem;margin-bottom:10px}
  /* Timer */
  .timer-card{padding:32px 24px;border-radius:24px;border-width:1px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
  .timer-display{font-size:4rem;margin:20px 0}
  /* Grades */
  .grade-class-card{border-radius:18px;padding:22px;border-width:1px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  /* Leaderboard */
  .lb-row{padding:12px 16px;border-radius:16px;border-width:1px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  /* Release notes - old modal */
  .release-box{border-radius:24px 24px 0 0;border-width:1px}
  /* Release notes - new fullpage */
  .releases-header-content{padding:20px 20px;flex-direction:column;align-items:flex-start}
  .releases-main-title{font-size:1.4rem}
  .releases-subtitle{font-size:.85rem}
  .releases-close-btn{position:absolute;top:20px;right:20px;width:40px;height:40px}
  .releases-content{padding:24px 20px}
  .release-card{padding:20px 20px;border-radius:16px}
  .release-card-title{font-size:1.15rem}
  .release-change-item{font-size:.88rem;padding-left:20px}
  /* FAB - more prominent */
  .fab{width:60px;height:60px;bottom:calc(84px + env(safe-area-inset-bottom));right:22px;box-shadow:0 6px 24px rgba(91,141,238,.4),0 12px 48px rgba(91,141,238,.25);font-size:1.5rem}
  .fab:active{transform:scale(.88)}
  /* Animations */
  .tab-content{animation:fadeInUp .25s cubic-bezier(.34,1.56,.64,1)}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .acard{animation:fadeInUp .2s cubic-bezier(.34,1.56,.64,1)}
  .acard:nth-child(1){animation-delay:.02s}
  .acard:nth-child(2){animation-delay:.04s}
  .acard:nth-child(3){animation-delay:.06s}
  .acard:nth-child(4){animation-delay:.08s}
  .acard:nth-child(5){animation-delay:.1s}
  
  /* AI Chat mobile optimizations */
  .sec-hd{flex-wrap:wrap;gap:8px}
  .sec-hd .sec-t{font-size:1.2rem}
  
  /* Make mode tabs scrollable on mobile */
  .sec-hd + div{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .sec-hd + div::-webkit-scrollbar{display:none}
  
  /* Chat input area - better mobile UX */
  .chat-input-wrap{padding:12px;gap:8px}
  .chat-input-wrap input{font-size:16px;padding:12px 14px;min-height:44px}
  .chat-input-wrap button{min-width:44px;min-height:44px;padding:10px}
}
/* ── PWA INSTALL BANNER ── */
.pwa-banner{position:fixed;bottom:calc(70px + env(safe-area-inset-bottom));left:12px;right:12px;background:var(--accent);color:#fff;border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:12px;z-index:300;box-shadow:0 8px 32px rgba(99,102,241,.4);animation:slideUp .3s ease}
@media(min-width:769px){.pwa-banner{bottom:20px;max-width:420px;left:50%;transform:translateX(-50%)}}
/* ── SEARCH BAR ── */
.search-bar{display:flex;align-items:center;gap:8px;background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:8px 14px;margin-bottom:16px;transition:border-color .15s}
.search-bar:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px var(--sh)}
.search-inp{flex:1;border:none;background:none;outline:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;color:var(--text)}
/* ── TIMER ── */
.timer-card{background:var(--card);border:1.5px solid var(--border);border-radius:20px;padding:28px 24px;text-align:center;margin-bottom:16px}
.timer-display{font-family:'Fraunces',serif;font-size:4.5rem;font-weight:700;color:var(--text);line-height:1;letter-spacing:-2px;margin:16px 0}
.timer-modes{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:20px}
.timer-mode-btn{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-size:.75rem;font-weight:700;cursor:pointer;color:var(--text2);transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.timer-mode-btn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.timer-btns{display:flex;gap:10px;justify-content:center}
.timer-ring{width:180px;height:180px;margin:0 auto}
/* ── LEADERBOARD ── */
.lb-row{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--card);border:1.5px solid var(--border);border-radius:14px;transition:transform .15s}
.lb-row:hover{transform:translateX(3px)}
.lb-rank{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--text3);width:28px;text-align:center;flex-shrink:0}
.lb-rank.top{color:var(--accent)}
.lb-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#ec4899);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.8rem;flex-shrink:0;overflow:hidden}
/* ── ANIMATIONS ── */
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.tab-content{animation:fadeIn .2s ease;padding-top:2px}
.acard{animation:fadeIn .15s ease}
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px}
.auth-card{background:var(--card);border:1.5px solid var(--border);border-radius:24px;padding:36px 32px;width:100%;max-width:420px;box-shadow:0 24px 60px var(--sh2)}
.auth-logo{width:56px;height:56px;background:linear-gradient(135deg,var(--text),var(--accent2));border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 16px}
.auth-title{font-family:'Fraunces',serif;font-size:1.7rem;font-weight:700;color:var(--text);text-align:center;margin-bottom:4px}
.auth-sub{font-size:.82rem;color:var(--text3);text-align:center;margin-bottom:24px}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--bg3);border-radius:12px;padding:4px;margin-bottom:22px;gap:4px}
.auth-tab{padding:8px;border-radius:9px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;color:var(--text3);cursor:pointer;transition:all .15s;background:transparent}
.auth-tab.on{background:var(--card);color:var(--text);box-shadow:0 2px 8px var(--sh)}
.auth-divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--text4);font-size:.75rem;font-weight:600}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border)}
.google-btn{width:100%;padding:11px;border-radius:12px;border:1.5px solid var(--border);background:var(--card);cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;font-weight:600;color:var(--text);display:flex;align-items:center;justify-content:center;gap:10px;transition:all .15s;margin-bottom:4px}
.google-btn:hover{background:var(--bg3);border-color:var(--border2);transform:translateY(-1px);box-shadow:0 4px 14px var(--sh)}
.auth-btn{width:100%;padding:12px;border-radius:12px;border:none;background:var(--accent);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .18s;margin-top:4px}
.auth-btn:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 4px 18px var(--sh2)}
.auth-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.auth-err{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:10px 13px;font-size:.8rem;color:#dc2626;margin-top:10px;line-height:1.5}
.dark .auth-err{background:#350000;border-color:#7f1d1d;color:#f87171}
.auth-user-pill{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:20px;padding:4px 10px 4px 6px;font-size:.75rem;font-weight:600;color:var(--text2)}
.auth-avatar{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}

.prompt-overlay{position:fixed;inset:0;background:rgba(8,10,18,.5);backdrop-filter:blur(6px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px}
.prompt-card{background:var(--mbg);border-radius:20px;padding:24px;width:100%;max-width:400px;border:1.5px solid var(--border);box-shadow:0 24px 60px var(--sh2);animation:slideUp .28s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.prompt-icon{font-size:2.2rem;margin-bottom:12px;display:block;text-align:center}
.prompt-title{font-family:'Fraunces',serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:6px;text-align:center}
.prompt-body{font-size:.82rem;color:var(--text2);line-height:1.6;text-align:center;margin-bottom:20px}
.prompt-body b{color:var(--text)}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOP ANIMATIONS & PARTICLE EFFECTS
   ═══════════════════════════════════════════════════════════════════════════ */
.shop-rarity{position:absolute;top:8px;left:8px;font-size:.58rem;font-weight:700;padding:3px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px}
.shop-icon-wrapper{position:relative;display:inline-block;margin-bottom:8px}
.shop-icon-animated{animation:shop-icon-float 3s ease-in-out infinite;display:inline-block}
@keyframes shop-icon-float{0%,100%{transform:translateY(0px) rotate(0deg)}25%{transform:translateY(-8px) rotate(2deg)}50%{transform:translateY(-4px) rotate(-2deg)}75%{transform:translateY(-8px) rotate(1deg)}}
.shop-particles{position:absolute;top:50%;left:50%;width:100%;height:100%;pointer-events:none}
.particle{position:absolute;width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b,#ec4899,#8b5cf6,#3b82f6);animation:particle-orbit 2s ease-in-out infinite;animation-delay:var(--delay);transform-origin:center;opacity:0}
@keyframes particle-orbit{0%{transform:rotate(var(--angle)) translateX(0px) scale(0);opacity:0}20%{opacity:1}50%{transform:rotate(var(--angle)) translateX(40px) scale(1);opacity:.8}100%{transform:rotate(var(--angle)) translateX(60px) scale(0);opacity:0}}
.animated-item.equipped .shop-icon-wrapper::before{content:'';position:absolute;top:-10px;left:-10px;right:-10px;bottom:-10px;background:linear-gradient(45deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3);background-size:400% 400%;border-radius:50%;opacity:.3;animation:rainbow-rotate 3s linear infinite;z-index:-1;filter:blur(8px)}
@keyframes rainbow-rotate{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.shop-card.equipped .shop-icon-wrapper::after{content:'✨';position:absolute;top:-5px;right:-5px;font-size:1.2rem;animation:sparkle-twinkle 1.5s ease-in-out infinite}
@keyframes sparkle-twinkle{0%,100%{opacity:1;transform:scale(1) rotate(0deg)}50%{opacity:.5;transform:scale(1.2) rotate(180deg)}}
.shop-card.equipped{animation:equipped-glow 2s ease-in-out infinite}
@keyframes equipped-glow{0%,100%{box-shadow:0 0 0 3px var(--sh2)}50%{box-shadow:0 0 0 3px var(--sh2),0 0 20px var(--accent)}}
.shop-card:hover .shop-icon-animated{animation-duration:1.5s;transform:scale(1.1)}

/* ═══════════════════════════════════════════════════════════════════════════
   BUDDY CREATURE ANIMATIONS
   ═══════════════════════════════════════════════════════════════════════════ */
/* Wings flutter animation */
.buddy-wings{animation:buddy-wings-flutter 2.5s ease-in-out infinite}
@keyframes buddy-wings-flutter{0%,100%{transform:scaleX(1)}25%{transform:scaleX(1.08) translateY(-2px)}50%{transform:scaleX(0.95) translateY(2px)}75%{transform:scaleX(1.05) translateY(-1px)}}

/* Pulse animation for fire aura, jetpack flames */
.buddy-pulse{animation:buddy-pulse 1.5s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
@keyframes buddy-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.15)}}

/* Flicker for lightning */
.buddy-flicker{animation:buddy-flicker 0.3s ease-in-out infinite}
@keyframes buddy-flicker{0%,100%{opacity:1}25%{opacity:0.4}50%{opacity:1}75%{opacity:0.6}}

/* Rotate for galaxy aura */
.buddy-rotate{animation:buddy-rotate 20s linear infinite}
@keyframes buddy-rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Twinkle for stars and sparkles */
.buddy-twinkle{animation:buddy-twinkle 2s ease-in-out infinite;animation-delay:var(--delay,0s)}
@keyframes buddy-twinkle{0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}

/* Float for hearts and floating items */
.buddy-float{animation:buddy-float 3s ease-in-out infinite;animation-delay:var(--delay,0s)}
@keyframes buddy-float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-12px)}}

/* Cape flutter - more dramatic */
.buddy-cape-flutter{animation:buddy-cape-flutter 2s ease-in-out infinite}
@keyframes buddy-cape-flutter{0%,100%{transform:translateX(0) rotate(0deg)}25%{transform:translateX(-3px) rotate(-2deg)}50%{transform:translateX(2px) rotate(1deg)}75%{transform:translateX(-2px) rotate(-1deg)}}

/* Shine for crown */
.buddy-shine{animation:buddy-shine 3s ease-in-out infinite}
@keyframes buddy-shine{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3) drop-shadow(0 0 8px rgba(255,215,0,0.6))}}

/* Glow for halo */
.buddy-glow{animation:buddy-glow 2s ease-in-out infinite}
@keyframes buddy-glow{0%,100%{opacity:0.75;filter:drop-shadow(0 0 8px rgba(255,215,0,0.5))}50%{opacity:1;filter:drop-shadow(0 0 16px rgba(255,215,0,0.8))}}

/* Rainbow animation */
.buddy-rainbow{animation:buddy-rainbow-shift 3s linear infinite}
@keyframes buddy-rainbow-shift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}

/* Fire aura pulse */
.buddy-fire-aura{animation:buddy-fire-pulse 2s ease-in-out infinite}
@keyframes buddy-fire-pulse{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(1.1);opacity:0.5}}

/* Lightning flicker group */
.buddy-lightning{animation:buddy-lightning-group 0.5s ease-in-out infinite}
@keyframes buddy-lightning-group{0%,100%{opacity:1}10%{opacity:0.3}20%{opacity:1}30%{opacity:0.5}40%,60%{opacity:1}70%{opacity:0.4}80%,100%{opacity:1}}

/* Galaxy rotation with stars */
.buddy-galaxy{animation:buddy-galaxy-spin 30s linear infinite}
@keyframes buddy-galaxy-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Sparkles group animation */
.buddy-sparkles text{animation:buddy-sparkle-pop 1.5s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.2s)}
@keyframes buddy-sparkle-pop{0%,100%{opacity:0.8;transform:scale(1) rotate(0deg)}50%{opacity:1;transform:scale(1.3) rotate(180deg)}}

/* Hearts floating up */
.buddy-hearts text{animation:buddy-heart-float 3s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.3s)}
@keyframes buddy-heart-float{0%{opacity:0;transform:translateY(0px) scale(0.8)}20%{opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-40px) scale(1.2)}}

/* Stars twinkling */
.buddy-stars text{animation:buddy-star-twinkle 2s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.25s)}
@keyframes buddy-star-twinkle{0%,100%{opacity:0.8;transform:scale(1) rotate(0deg)}50%{opacity:0.3;transform:scale(0.6) rotate(180deg)}}

/* Snow falling */
.buddy-snow text{animation:buddy-snow-fall 4s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.15s)}
@keyframes buddy-snow-fall{0%{opacity:0;transform:translateY(-20px) rotate(0deg)}20%{opacity:0.7}80%{opacity:0.7}100%{opacity:0;transform:translateY(60px) rotate(360deg)}}

/* Leaves swirling */
.buddy-leaves text{animation:buddy-leaf-swirl 5s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.2s)}
@keyframes buddy-leaf-swirl{0%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(10px,-15px) rotate(90deg)}50%{transform:translate(-5px,10px) rotate(180deg)}75%{transform:translate(8px,-8px) rotate(270deg)}100%{transform:translate(0,0) rotate(360deg)}}

/* Bubbles floating */
.buddy-bubbles circle{animation:buddy-bubble-float 4s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.25s)}
@keyframes buddy-bubble-float{0%{opacity:0;transform:translateY(20px) scale(0.5)}20%{opacity:0.6}80%{opacity:0.6}100%{opacity:0;transform:translateY(-60px) scale(1.2)}}

/* Music notes bouncing */
.buddy-music text{animation:buddy-music-bounce 2.5s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.3s)}
@keyframes buddy-music-bounce{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-15px) rotate(-10deg)}50%{transform:translateY(0) rotate(0deg)}75%{transform:translateY(-10px) rotate(10deg)}}

/* Aurora waves */
.buddy-aurora path{animation:buddy-aurora-wave 3s ease-in-out infinite}
@keyframes buddy-aurora-wave{0%,100%{opacity:0.4;stroke-width:8}50%{opacity:0.7;stroke-width:12}}

/* Crown glow pulse */
.buddy-crown-glow{animation:buddy-crown-pulse 2s ease-in-out infinite}
@keyframes buddy-crown-pulse{0%,100%{filter:drop-shadow(0 0 10px rgba(255,215,0,0.6))}50%{filter:drop-shadow(0 0 20px rgba(255,215,0,0.9))}}

/* Angel glow radiance */
.buddy-angel-glow circle{animation:buddy-angel-radiance 3s ease-in-out infinite}
@keyframes buddy-angel-radiance{0%,100%{opacity:0.15;transform:scale(1)}50%{opacity:0.3;transform:scale(1.1)}}

/* Demon flames flicker */
.buddy-demon-flames{animation:buddy-demon-flicker 0.4s ease-in-out infinite}
@keyframes buddy-demon-flicker{0%,100%{opacity:1}25%{opacity:0.7}50%{opacity:1}75%{opacity:0.8}}

/* Sakura petals falling */
.buddy-sakura text{animation:buddy-sakura-fall 5s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.2s)}
@keyframes buddy-sakura-fall{0%{opacity:0;transform:translateY(-30px) translateX(0) rotate(0deg)}20%{opacity:0.8}80%{opacity:0.8}100%{opacity:0;transform:translateY(80px) translateX(20px) rotate(180deg)}}

/* Confetti spinning */
.buddy-confetti rect{animation:buddy-confetti-spin 2s ease-in-out infinite;animation-delay:calc(var(--i,0) * 0.1s)}
@keyframes buddy-confetti-spin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.3)}100%{transform:rotate(360deg) scale(1)}}

/* Magic circle rotation */
.buddy-magic-circle circle{animation:buddy-magic-rotate 8s linear infinite}
@keyframes buddy-magic-rotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Time warp ripple */
.buddy-time-warp circle{animation:buddy-time-ripple 2s ease-out infinite}
@keyframes buddy-time-ripple{0%{opacity:0.5;transform:scale(0.8)}100%{opacity:0;transform:scale(1.3)}}

/* Particles rising from bottom to top */
.buddy-particle-rise{animation:buddy-particle-rise 4s ease-in infinite;animation-delay:var(--delay,0s)}
@keyframes buddy-particle-rise{0%{opacity:0;transform:translateY(0) translateX(0)}10%{opacity:0.7}90%{opacity:0.7}100%{opacity:0;transform:translateY(-180px) translateX(var(--drift,0px))}}
`;

