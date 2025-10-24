(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let running = false;
  let deleted  = 0;
  let errorCount = 0;

  /* ---------------  等待选择器  --------------- */
  function waitFor(selector, timeout = 300) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const el = typeof selector === 'function' ? selector() : document.querySelector(selector);
        if (el) return resolve(el);
        if (timeout && Date.now() - start > timeout)
          return reject(new Error(`waitFor ${selector} timeout`));
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /* ---------------  删除一条  --------------- */
  async function deleteOne() {
    try {
      const moreBtn = await waitFor('a.chat-info-item .more-btn');
      moreBtn.click();
      await sleep(300);                               

      const delIcon = await waitFor(() => [...document.querySelectorAll('svg[name="Delete"]')].pop());
      delIcon.closest('li,div').click();
      await sleep(300);                                

      const confirmBtn = await waitFor(() =>
        document.querySelector('.el-message-box__btns .el-button--primary') ||
        document.querySelector('.confirm-btn') ||
        [...document.querySelectorAll('button')].find(b => /确认|删除/.test(b.textContent))
      );
      confirmBtn.click();

      deleted++;
      $('counter').textContent = deleted;
      return 'ok';
    } catch (e) {
      console.error('[DelConsole] 删除出错:', e);
      return 'error';
    }
  }

  /* ---------------  主循环  --------------- */
  async function loop() {
    while (running) {
      const res = await deleteOne();
      if (res === 'error') {
        errorCount++;
        if (errorCount >= 3) {
          toggle(false);
          break;
        }
        await sleep(300);                             
        continue;
      }
      errorCount = 0;
      await sleep(300);                                
    }
  }

  /* ---------------  UI（无日志）  --------------- */
  const html = `
<div id="del-console">
  <style>
    #del-console{
      position:fixed;
      bottom:20px;right:20px;
      width:240px;
      background:rgba(255,255,255,.75);
      backdrop-filter:blur(12px);
      border-radius:12px;
      box-shadow:0 8px 32px rgba(0,0,0,.15);
      border:1px solid rgba(255,255,255,.4);
      font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial;
      z-index:9999;
      user-select:none;
      padding:12px;
    }
    #del-console h4{margin:0 0 8px;font-size:15px;font-weight:600;}
    #del-console .row{display:flex;align-items:center;justify-content:space-between;}
    #del-console .btn{
      background:#409eff;color:#fff;border:none;
      border-radius:6px;padding:6px 10px;font-size:13px;cursor:pointer;
    }
    #del-console .btn:hover{background:#006cd9;}
    #del-console .btn:disabled{background:#ccc;cursor:not-allowed;}
  </style>
  <h4>已删除：<b id="counter">0</b> 条</h4>
  <div class="row">
    <span>状态：<span id="status">待机</span></span>
    <button id="btn-toggle" class="btn">▶ 开始</button>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const $ = id => document.getElementById(id);
  const renderStatus = () => {
    $('status').textContent = running ? '运行中' : '已暂停';
    $('btn-toggle').textContent = running ? '⏸ 暂停' : '▶ 开始';
  };
  const toggle = flag => {
    running = flag;
    renderStatus();
    running ? loop() : null;
  };

  $('btn-toggle').onclick = () => toggle(!running);

  /* ---------------  初始化  --------------- */
  $('counter').textContent = 0;
  renderStatus();
})();