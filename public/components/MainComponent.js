import { component } from "./components";

export class MainComponent {
  _default;

  constructor(name) {
    this._default = component(name);
  }

  get _view() {
    return this._default;
  }
}
