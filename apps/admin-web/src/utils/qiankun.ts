// qiankun experimentalStyleIsolation 会把子应用 CSS 限定在 div[data-qiankun] 内，
// 而 Arco 弹层默认挂到 document.body（作用域外），会丢失子应用样式且层级错乱。
// 统一把弹层挂回 qiankun 容器；独立运行（无 qiankun）时回退 body。
export function getQiankunPopupContainer(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-qiankun]") ?? document.body;
}
