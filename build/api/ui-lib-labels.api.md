## API Report File for "@contember/react-ui-lib"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Provider } from 'react';
import { ReactNode } from 'react';

// @public (undocumented)
export type EnumOptionsFormatter = (enumName: string) => Record<string, ReactNode>;

// @public (undocumented)
export const EnumOptionsFormatterProvider: Provider<EnumOptionsFormatter>;

// @public (undocumented)
export type FieldLabelFormatter = (entityName: string, fieldName: string) => ReactNode | null;

// @public (undocumented)
export const FieldLabelFormatterProvider: Provider<FieldLabelFormatter>;

// @public (undocumented)
export const useEnumOptionsFormatter: () => EnumOptionsFormatter;

// @public (undocumented)
export const useFieldLabelFormatter: () => FieldLabelFormatter;

// (No @packageDocumentation comment for this package)

```
