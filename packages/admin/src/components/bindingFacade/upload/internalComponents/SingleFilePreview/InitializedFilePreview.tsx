import type { EntityAccessor } from '@contember/binding'
import type { SingleFileUploadState } from '@contember/react-client'
import { FilePreview, Message, UploadProgress } from '@contember/ui'
import { ReactNode, useEffect, useRef, useState } from 'react'
import type { FullFileKind } from '../../interfaces'

export interface InitializedFilePreviewProps {
	fileKind: FullFileKind
	getContainingEntity: EntityAccessor.GetEntityAccessor
	uploadState: SingleFileUploadState & { readyState: 'uploading' | 'success' | 'error' | 'aborted' }
}

type ExtractionState =
	| { name: 'uninitialized' }
	| { name: 'working' }
	| { name: 'error' }
	| {
			name: 'success'
			data: any[]
	  }

export function InitializedFilePreview({ fileKind, getContainingEntity, uploadState }: InitializedFilePreviewProps) {
	const [extractionState, setExtractionState] = useState<ExtractionState>({ name: 'uninitialized' })
	const isMountedRef = useRef(true)

	useEffect(() => {
		const extractData = async () => {
			if (extractionState.name !== 'uninitialized') {
				return
			}
			const dataPromises = fileKind.extractors.map(extractor =>
				extractor.extractFileData
					? extractor.extractFileData({
							file: uploadState.file,
							acceptArtifacts: uploadState.metadata,
							objectUrl: uploadState.previewUrl,
					  })
					: Promise.resolve(),
			)
			setExtractionState({ name: 'working' })
			try {
				const data = await Promise.all(dataPromises)
				if (!isMountedRef.current) {
					return
				}
				setExtractionState({
					name: 'success',
					data,
				})
			} catch (e) {
				setExtractionState({
					name: 'error',
				})
			}
		}
		extractData()
	}, [extractionState.name, fileKind.extractors, uploadState])

	useEffect(() => {
		if (uploadState.readyState !== 'success' || extractionState.name !== 'success') {
			return
		}

		getContainingEntity().batchUpdates(getEntity => {
			if (fileKind.baseEntity) {
				getEntity = getEntity().getEntity(fileKind.baseEntity).getAccessor
			}

			for (let i = 0; i < fileKind.extractors.length; i++) {
				const extractor = fileKind.extractors[i]
				const extractedData = extractionState.data[i]

				extractor.populateFields({
					file: uploadState.file,
					objectUrl: uploadState.previewUrl,
					extractedData,
					uploadResult: uploadState.result,
					acceptArtifacts: uploadState.metadata,
					entity: getEntity(),
				})
			}
		})
	}, [extractionState, fileKind.baseEntity, fileKind.extractors, getContainingEntity, uploadState])

	useEffect(
		() => () => {
			isMountedRef.current = false
		},
		[],
	)

	const getOverlay = (): ReactNode => {
		if (uploadState.readyState === 'error' && uploadState.error?.options.endUserMessage) {
			return <Message type="danger">{uploadState.error.options.endUserMessage}</Message>
		}
		if (
			uploadState.readyState === 'error' ||
			extractionState.name === 'error' ||
			uploadState.readyState === 'aborted'
		) {
			return `Upload failed`
		}
		if (uploadState.readyState === 'success') {
			if (extractionState.name === 'success') {
				return undefined
			}
			return <UploadProgress progress="Finalizing" />
		}
		if (uploadState.readyState === 'uploading') {
			return <UploadProgress progress={uploadState.progress} />
		}
		return <UploadProgress />
	}
	return (
		<FilePreview overlay={getOverlay()}>
			{fileKind.renderFilePreview({
				file: uploadState.file,
				objectUrl: uploadState.previewUrl,
				acceptArtifacts: uploadState.metadata,
			})}
		</FilePreview>
	)
}
