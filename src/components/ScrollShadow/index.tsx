import {
  ScrollShadow as NextUIScrollShadow,
  type ScrollShadowProps as NextUIScrollShadowProps,
} from '@heroui/scroll-shadow'

interface ScrollShadowProps extends NextUIScrollShadowProps {}

function ScrollShadow(props: ScrollShadowProps) {
  return <NextUIScrollShadow {...props} />
}

export default ScrollShadow
