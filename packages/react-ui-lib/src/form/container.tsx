import * as React from 'react'
import { ReactNode } from 'react'
import { FormContainerUI, FormDescriptionUI, FormErrorUI, FormLabelUI, FormLabelWrapperUI } from './ui'
import { useErrorFormatter } from '../errors'
import { Component, ErrorAccessor } from '@contember/interface'
import { FormError, FormFieldStateProvider, FormLabel, useFormFieldState } from '@contember/react-form'

export interface FormContainerProps {
	label?: ReactNode
	description?: ReactNode
	children: ReactNode
	errors?: ErrorAccessor.Error[] | ReactNode
	required?: boolean
}


export const FormContainer = Component(({ children, description, label, required, errors }: FormContainerProps) => {
	const errorsNode = Array.isArray(errors) ? undefined : errors
	const errorsList = Array.isArray(errors) ? errors : []
	const hasState = useFormFieldState() !== undefined

	const inner = <>
		<FormContainerUI>
			<FormLabelWrapperUI>
				{label && <FormLabel>
					<FormLabelUI required={required}>
						{label}
					</FormLabelUI>
				</FormLabel>}
			</FormLabelWrapperUI>
			<div>
				{children}
			</div>
			<div>
				{description && <FormDescriptionUI>
					{description}
				</FormDescriptionUI>}

				<FormError formatter={useErrorFormatter()}>
					<FormErrorUI />
				</FormError>
				{errorsNode}
			</div>
		</FormContainerUI>
	</>
	return hasState
		? inner
		: <FormFieldStateProvider required={required} errors={errorsList} dirty={false}>{inner}</FormFieldStateProvider>
}, ({ children, label, description }) => <>
	{label}
	{children}
	{description}
</>)

/**
 * @deprecated use `FormContainer` instead
 */
export const StandaloneFormContainer = FormContainer
