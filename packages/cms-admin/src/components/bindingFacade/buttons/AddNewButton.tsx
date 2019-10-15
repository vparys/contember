import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import { Button, ButtonProps, FormGroup } from '@contember/ui'
import * as React from 'react'
import { EntityCollectionAccessor, useMutationState } from '../../../binding'

export type AddNewButtonProps = ButtonProps & {
	addNew: EntityCollectionAccessor['addNew']
	icon?: IconName
}

export const AddNewButton = React.memo((props: AddNewButtonProps) => {
	const isMutating = useMutationState()
	const { addNew, icon, ...rest } = props
	const addNewCallback = React.useCallback(() => addNew && addNew(), [addNew])
	if (addNew) {
		return (
			<FormGroup label={undefined}>
				<Button onClick={addNewCallback} disabled={isMutating} distinction="seamless" flow="block" {...rest}>
					<Icon
						icon={icon || IconNames.ADD}
						style={{
							marginRight: '0.2em',
							position: 'relative',
							top: '0.05em',
						}}
					/>
					{props.children || 'Add'}
				</Button>
			</FormGroup>
		)
	}
	return null
})
