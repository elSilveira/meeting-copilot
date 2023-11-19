export function component(name) {
  let res = Object.values(ComponentMap).flatMap(componentMap =>
    Array.from(componentMap.values()).filter(component => component.id === name)
  );
  console.log(res);
  return res
}

export const ComponentMap = {
  views: new Map([
    ['mainView', { type: 'div', id: 'mainView', className: 'my-main-view' }],
    ['myView', { type: 'div', id: 'myView', className: 'my-view' }],
    ['myButtonsView', { type: 'div', id: 'myBtnView', className: 'my-btn-view' }],
  ]),
  dialogs: new Map([
    ['alertComponent', { type: 'div', id: 'alertComponent', className: 'alert-msg' }],
  ]),
  buttons: new Map([
    ['insightsBtn', { type: 'div', id: 'insightsBtn', className: 'my-btn' }],
    ['explainBtn', { type: 'div', id: 'explainBtn', className: 'my-btn' }],
    ['simpleBtn', { type: 'div', id: 'simpleBtn', className: 'my-btn' }],
    ['tipsBtn', { type: 'div', id: 'tipsBtn', className: 'my-btn' }],
    ['clearBtn', { type: 'div', id: 'myClrBtn', className: 'my-btn' }],
  ]),
};
