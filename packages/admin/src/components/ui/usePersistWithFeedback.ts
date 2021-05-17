import { ErrorPersistResult, SuccessfulPersistResult, usePersist } from '@contember/binding'
import { useCallback } from 'react'
import { useShowToastWithTimeout } from './useShowToastWithTimeout'

export const usePersistWithFeedback = () => {
	const persistAll = usePersist()
	const showToast = useShowToastWithTimeout()

	return useCallback((): Promise<SuccessfulPersistResult> => {
		return persistAll()
			.then(result => {
				console.debug('persist success', result)
				showToast({
					type: 'success',
					message: 'Success!',
				})
				return result
			})
			.catch((result: ErrorPersistResult) => {
				console.debug('persist error', result)
				showToast(
					{
						type: 'error',
						message: 'Error!',
					},
					8000,
				)
				return Promise.reject(result)
			})
	}, [showToast, persistAll])
}
