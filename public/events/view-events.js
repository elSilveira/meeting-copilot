export default function viewEvents() {
  onkeydown = (ev) => { ev.stopPropagation; ev.preventDefault(); }
}