import { createPortal } from 'react-dom'

// Renders a modal straight into <body>, so `position: fixed` always means the window.
// Inside the page, an animated or blurred parent (like .page-enter or the top bar)
// would otherwise become the modal's frame and push it off-screen.
export default function ModalPortal({ children }) {
  return createPortal(children, document.body)
}
