import { createElement, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SugaredQualifiedSingleEntity, TreeRootId } from '@contember/binding'
import { useExtendTree } from './useExtendTree'
import { EntitySubTree } from '../coreComponents'
import { useObjectMemo } from '@contember/react-utils'

export type UseEntitySubTreeLoaderStateInitial = {
	state: 'initial'
	entity: undefined
	treeRootId: undefined
	customState: undefined
	isLoading: false
}

export type UseEntitySubTreeLoaderStateLoading = {
	state: 'loading'
	entity: undefined
	treeRootId: undefined
	customState: undefined
	isLoading: true
}

export type UseEntitySubTreeLoaderStateRefreshing<State> = {
	state: 'refreshing'
	entity: SugaredQualifiedSingleEntity
	treeRootId: TreeRootId | undefined
	customState: State
	isLoading: true
}


export type UseEntitySubTreeLoaderStateLoaded<State> = {
	state: 'loaded'
	entity: SugaredQualifiedSingleEntity
	treeRootId: TreeRootId | undefined
	customState: State
	isLoading: false
}

export type UseEntitySubTreeLoaderStateFailed = {
	state: 'failed'
	error: unknown
	entity: undefined
	treeRootId: undefined
	customState: undefined
	isLoading: false
}


export type UseEntitySubTreeLoaderState<State> =
	| UseEntitySubTreeLoaderStateInitial
	| UseEntitySubTreeLoaderStateLoading
	| UseEntitySubTreeLoaderStateRefreshing<State>
	| UseEntitySubTreeLoaderStateLoaded<State>
	| UseEntitySubTreeLoaderStateFailed

export type EntityListSubTreeLoaderState = UseEntitySubTreeLoaderState<any>['state']

export type UseEntitySubTreeLoaderStateMethods = {
	reload: () => void
}

const emptyObject = {} as SugaredQualifiedSingleEntity

export const useEntitySubTreeLoader = <State>(entity: SugaredQualifiedSingleEntity | undefined, children: ReactNode, state?: State): [UseEntitySubTreeLoaderState<State>, UseEntitySubTreeLoaderStateMethods] => {
	const [displayedState, setDisplayedState] = useState<UseEntitySubTreeLoaderState<State>>({
		state: 'initial',
		isLoading: false,
		entity: undefined,
		treeRootId: undefined,
		customState: undefined,
	})
	const currentlyLoading = useRef<{
		entity: SugaredQualifiedSingleEntity
		state?: State
	}>()

	const extendTree = useExtendTree()
	const [reloadTrigger, setReloadTrigger] = useState<object | null>(null)
	const memoizedEntity = useObjectMemo(entity ?? emptyObject)
	const resolvedEntity = entity ? memoizedEntity : undefined

	useEffect(() => {
		(async () => {
			if (!resolvedEntity) {
				return
			}

			currentlyLoading.current = {
				entity: resolvedEntity,
				state,
			}

			setDisplayedState(it => {
				if (it.state === 'initial' || it.state === 'loading' || it.state === 'failed') {
					return {
						...it,
						isLoading: true,
						state: 'loading',
					}
				} else {
					return {
						...it,
						isLoading: true,
						state: 'refreshing',
					}
				}
			})

			const newTreeRootId = await extendTree(
				createElement(EntitySubTree, {
					...resolvedEntity,
					children,
				}),
				{
					force: reloadTrigger !== null,
					onError: e => {
						console.error(e)

						currentlyLoading.current = undefined

						setDisplayedState({
							state: 'failed',
							error: e,
							entity: undefined,
							treeRootId: undefined,
							customState: undefined,
							isLoading: false,
						})
					},
				},
			)


			if (newTreeRootId) {
				currentlyLoading.current = undefined
				setDisplayedState({
					state: 'loaded',
					entity: resolvedEntity,
					treeRootId: newTreeRootId,
					customState: state as State,
					isLoading: false,
				})
			}
		})()
	}, [extendTree, resolvedEntity, children, state, reloadTrigger])

	return [
		displayedState,
		{
			reload: useCallback(() => setReloadTrigger({}), []),
		},
	]
}
