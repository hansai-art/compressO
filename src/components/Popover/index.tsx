import {
  Popover as NextUIPopover,
  type PopoverProps as NextUIPopoverProps,
} from '@heroui/react'

interface PopoverProps extends NextUIPopoverProps {}

function Popover(props: PopoverProps) {
  return <NextUIPopover {...props} />
}

export default Popover
