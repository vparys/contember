import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface DevErrorProps {
	error: Error | PromiseRejectionEvent | ErrorEvent
	stack?: string
}

export function DevError(props: DevErrorProps) {
	const prefix = useClassNamePrefix()

	let error: Error | undefined

	if (props.error instanceof PromiseRejectionEvent) {
		error = props.error.reason
	} else if (props.error instanceof ErrorEvent) {
		error = props.error.error
	} else {
		error = props.error
	}

	if (!(error instanceof Error)) {
		error = undefined
	}

	return (
		<div className={`${prefix}devError`}>
			<div className={`${prefix}devError-in`}>
				<h1 className={`${prefix}devError-message`}>
					{!!error && `${error.name}: ${error.message}`}
					{!error && 'Error!'}
				</h1>
				{!!props.stack && (
					<div className={`${prefix}devError-stack`}>
						<div className={`${prefix}devError-stack-dump`}>{props.stack}</div>
					</div>
				)}
			</div>
		</div>
	)
}
