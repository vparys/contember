export function dataAttribute(value: boolean | null | undefined): '' | undefined
export function dataAttribute<const T extends string>(value: T): T
export function dataAttribute(value: boolean | string | number | undefined | null): string | undefined
export function dataAttribute(value: unknown): string | true | undefined {
	if (value === false || value === undefined || value === null) {
		return undefined
	} else if (value === true) {
		// Closest to HTML: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
		// React issue: https://github.com/facebook/react/issues/24812
		return ''
	} else {
		return String(value)
	}
}
