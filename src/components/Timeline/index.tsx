import { TimelineAction, TimelineRow } from '@xzdarcy/timeline-engine'
import { FC } from 'react'

export const BoundaryRowActionRender: FC<{
  action: TimelineAction
  row: TimelineRow
}> = ({ action }) => {
  return (
    <div className="flex justify-center items-center bg-primary h-[2px] mt-3 rounded-lg">
      <p className="text-center text-white1">{`${(
        action.end - action.start
      ).toFixed(2)}s`}</p>
    </div>
  )
}
