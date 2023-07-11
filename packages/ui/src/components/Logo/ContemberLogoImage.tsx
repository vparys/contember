import { useClassNameFactory } from '@contember/react-utils'

interface ContemberLogoImage {
	withLabel?: boolean
}

export const ContemberLogoImage = ({ withLabel }: ContemberLogoImage) => {
	const componentClassName = useClassNameFactory('contember-logo-image')

	return (
		<svg
			className={componentClassName('symbol', withLabel && 'view-with-label')}
			viewBox={`0 0 ${withLabel ? '202' : '32'} 26`}
			xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient x1="0" y1=".5" x2="1" y2=".5" id="a">
					<stop offset="0" stopColor="#1F00B0" />
					<stop offset="1" stopColor="#000067" />
				</linearGradient>
				<linearGradient x1="0" y1=".5" x2="1" y2=".5" id="b">
					<stop offset="0" stopColor="#006EFF" />
					<stop offset="1" stopColor="#45CFF2" />
				</linearGradient>
				<linearGradient x1="0" y1=".5" x2="1" y2=".5" id="c">
					<stop offset="0" stopColor="#15009C" />
					<stop offset=".76" stopColor="#3DA9EB" />
				</linearGradient>
				<linearGradient x1="0" y1=".5" x2="1" y2=".5" id="d">
					<stop offset="0" stopColor="#15009C" />
					<stop offset="1" stopColor="#3DA9EB" />
				</linearGradient>
			</defs>
			<path
				d="M29.14 12.39c-.76-.1-1.27-.83-1.27-1.6V3.04H4.5A1.55 1.55 0 002.98 4.6v8.47c0 .76-.5 1.5-1.26 1.59A1.5 1.5 0 010 13.15V1.56C0 .7.7 0 1.55 0h29.36v10.9a1.58 1.58 0 01-1.77 1.49z"
				transform="translate(.09 1.02)" fill="url(#a)" />
			<path
				d="M9.55 14.6a1.7 1.7 0 01-.85-.25C1.42 9.35.09 2.12.03 1.8A1.5 1.5 0 011.23.05C1.7-.05 2.75.02 2.75.02l.22 1.27c0 .07 1.2 6.34 7.4 10.58.7.47.86 1.4.38 2.1a1.4 1.4 0 01-1.2.64z"
				fill="url(#b)" transform="translate(0 1)" />
			<path
				d="M9.42 12.31c-.28 0-.57-.1-.85-.25C1.29 7.06.09 2.09.03 1.77A1.5 1.5 0 011.23.02c.82-.13 1.58.41 1.74 1.2.03.1 1.14 4.08 7.28 8.32.7.48.85 1.4.38 2.1-.26.42-.73.67-1.2.67z"
				transform="translate(.03 12.69)" fill="url(#c)" />
			<path
				d="M1.49 23.98c-.25 0-.54-.06-.76-.22a1.42 1.42 0 01-.73-1.3l.13-9.4c0-.54.28-1.02.76-1.28L20.76.22c.47-.25 2.27-.22 2.27-.22v11.75l-20.78 12c-.25.17-.5.23-.76.23zm1.58-10.03l-.06 5.9 16.96-9.82V4.14l-16.9 9.8z"
				transform="translate(7.97 1.02)" fill="url(#d)" />
			{withLabel && <path className={componentClassName('label')}
				d="M40 11.4C40 4.95 44.4 0 50.84 0c5.27 0 8.62 3.13 9.64 6.68l-3.7 1.43c-.8-2.34-2.5-4.62-5.97-4.62-4.08 0-6.64 2.93-6.64 7.88 0 4.98 2.53 8.08 6.64 8.08 3.44 0 5.21-2.09 6.06-4.72l3.64 1.46c-1.36 3.98-4.52 6.78-9.7 6.78C44.14 23 40 17.98 40 11.4zm22.62 3.3c0-4.93 3.23-8.31 7.71-8.31 4.46 0 7.68 3.38 7.68 8.3 0 4.99-3.22 8.31-7.68 8.31-4.45 0-7.7-3.52-7.7-8.3zm11.47.06c0-3.49-1.54-5.25-3.79-5.25-2.27 0-3.82 1.76-3.82 5.25 0 3.45 1.55 5.11 3.82 5.11 2.25 0 3.8-1.66 3.8-5.11zm7.37 7.75V6.84h3.38c0 .98.1 3.62.1 3.62.6-1.99 2.3-4.1 4.95-4.1 3.48 0 5.22 2.34 5.22 5.82v10.33h-3.73v-9.54c0-2.35-1.08-3.36-2.75-3.36-3.41 0-3.48 3.91-3.48 5.8v7.13h-3.7v-.03zm23.38 0c-2.47 0-3.86-1.5-3.86-4V9.8H97.7v-3h3.28V1.89h3.73v4.92h4.05v3h-4.05v8.08c0 1 .44 1.46 1.4 1.46h3.21v3.13h-4.48v.03zm6.26-7.81c0-5.02 3.15-8.31 7.36-8.31 4.9 0 7.58 4.07 7.07 9.25h-10.7c.12 3.19 1.8 4.33 3.75 4.33 2.15 0 3.16-1.5 3.7-2.83l3.35 1.3c-.98 2.44-3.1 4.56-7.11 4.56-4.49 0-7.43-3.13-7.43-8.3zm10.74-1.9c-.13-2.31-1.46-3.55-3.38-3.55-1.84 0-3.26 1.27-3.54 3.55h6.92zm7.33 9.71V6.84h3.25l.03 3.23a4.84 4.84 0 014.68-3.68c1.93 0 3.63 1.27 4.14 3.68.63-2.15 3.57-3.68 5.72-3.68 2.9 0 5.05 2.05 5.05 5.92v10.23h-3.72v-9.57c0-2.41-1.08-3.33-2.72-3.33-3.13 0-3.2 3.33-3.2 5.15v7.75h-3.66v-9.57c0-2.41-1.1-3.33-2.75-3.33-3.1 0-3.19 3.33-3.19 5.15v7.75h-3.63v-.03zm31.06-3.26s-.41 2.22-.41 3.3h-3.35V.51h3.7v3.3c0 3.54.09 6.31.09 6.31.63-1.66 1.93-3.74 5.02-3.74 3.64 0 6.23 3.29 6.23 8.3 0 5.02-2.6 8.31-6.23 8.31-3.22 0-4.36-2.25-5.05-3.75zm7.42-4.59c0-3.9-1.64-5.24-3.79-5.24-2.27 0-3.85 1.72-3.85 5.24 0 3.55 1.58 5.31 3.85 5.31 2.15 0 3.8-1.37 3.8-5.31zm6.32.04c0-5.02 3.16-8.31 7.37-8.31 4.9 0 7.58 4.07 7.07 9.25h-10.7c.12 3.19 1.8 4.33 3.75 4.33 2.15 0 3.16-1.5 3.7-2.83l3.35 1.3c-.98 2.44-3.1 4.56-7.11 4.56-4.49 0-7.43-3.13-7.43-8.3zm10.75-1.9c-.13-2.31-1.46-3.55-3.38-3.55-1.84 0-3.26 1.27-3.54 3.55h6.92zm7.33 9.71V6.84h3.4l-.02 4.63c.66-3 2.27-4.92 5.43-4.92.54 0 .86.03 1.14.1v3.9c-.54-.06-1.1-.1-1.64-.1-3.2 0-4.62 1.57-4.62 5.64v6.42h-3.7z"
				fill="#0094FF" />}
		</svg>
	)
}
