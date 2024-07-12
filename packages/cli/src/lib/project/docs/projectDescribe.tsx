import { Schema } from '@contember/schema'
import { h } from 'preact'
import render from 'preact-render-to-string'
import { ProjectInfo } from './components/ProjectInfo'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const renderProjectInfoHtml = async (schema: Schema, projectName: string) => {
	const html = render(<ProjectInfo schema={schema} projectName={projectName} />)

	const css = await readFile(dirname(fileURLToPath(import.meta.url)) + '/resources/out.css')
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>${css}</style>
	<title>${projectName}</title>
</head>
<body>
${html}
</body>
</html>
`

}

