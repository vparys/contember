import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'
import { Trio } from './Trio'

interface LayoutProps {
	children?: React.ReactNode

	top?: React.ReactNode
	topStart?: React.ReactNode
	topCenter?: React.ReactNode
	topEnd?: React.ReactNode

	sideBar?: React.ReactNode
	sideBarStart?: React.ReactNode
	sideBarCenter?: React.ReactNode
	sideBarEnd?: React.ReactNode

	actions?: React.ReactNode
	actionsStart?: React.ReactNode
	actionsCenter?: React.ReactNode
	actionsEnd?: React.ReactNode

	main?: React.ReactNode
	mainStart?: React.ReactNode
	mainCenter?: React.ReactNode
	mainEnd?: React.ReactNode
}

export const Layout = ({
	children,
	top,
	topStart,
	topCenter,
	topEnd,
	sideBar,
	sideBarStart,
	sideBarCenter,
	sideBarEnd,
	actions,
	actionsStart,
	actionsCenter,
	actionsEnd,
	main,
	mainStart,
	mainCenter,
	mainEnd,
}: LayoutProps) => {
	const prefix = useClassNamePrefix()

	const [collapsed, setCollapsed] = React.useState(false)

	const toggleCollapsed = React.useCallback(() => {
		setCollapsed(!collapsed)
	}, [collapsed, setCollapsed])

	const spaced = React.useCallback(
		(content?: React.ReactNode) => content && <div className={`${prefix}layout-space`}>{content}</div>,
		[prefix],
	)

	return (
		<div className={cn(`${prefix}layout`, collapsed && 'view-collapsed')}>
			<div className={`${prefix}layout-top`}>
				<div className={`${prefix}layout-topBar`}>
					{top}
					{(topStart || topCenter || topEnd) && (
						<>
							<div className={`${prefix}layout-topBar-start`}>{spaced(topStart)}</div>
							<div className={`${prefix}layout-topBar-center`}>{spaced(topCenter)}</div>
							<div className={`${prefix}layout-topBar-end`}>{spaced(topEnd)}</div>
						</>
					)}
				</div>
				{(actions || actionsStart || actionsCenter || actionsEnd) && (
					<div className={`${prefix}layout-actionBar`}>
						<div className={`${prefix}layout-actionBar-sideBar`}></div>
						<div className={`${prefix}layout-actionBar-main`}>
							<div className={`${prefix}layout-actionBar-main-in`}>
								{actions}
								<Trio
									clickThroughSpace
									start={spaced(actionsStart)}
									center={spaced(actionsCenter)}
									end={spaced(actionsEnd)}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
			<div className={`${prefix}layout-bottom`}>
				<div className={`${prefix}layout-sideBar`}>
					<button type="button" className={`${prefix}layout-sideBar-collapseButton`} onClick={toggleCollapsed}>
						<span className={`${prefix}layout-sideBar-collapseButton-label`}>Close</span>
					</button>
					<div className={`${prefix}layout-sideBar-in`}>
						<div className={`${prefix}layout-sideBar-in-in`}>
							{sideBar}
							<Trio start={spaced(sideBarStart)} center={spaced(sideBarCenter)} end={spaced(sideBarEnd)} column />
						</div>
					</div>
				</div>
				<div className={`${prefix}layout-main`}>
					{main}
					<Trio
						start={spaced(
							(mainStart || children) && (
								<>
									{mainStart}
									{children}
								</>
							),
						)}
						center={spaced(mainCenter)}
						end={spaced(mainEnd)}
						column
					/>
				</div>
			</div>
		</div>
	)
}
Layout.displayName = 'Layout'
