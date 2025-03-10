import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { postWithAuthor } from './schema'

test('connect', async () => {
	await execute({
		schema: postWithAuthor,
		query: GQL`mutation {
        updatePost(
            by: {id: "${testUuid(2)}"},
            data: {author: {connect: {id: "${testUuid(1)}"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: uuid as "author_id", "root_"."author_id" as "author_id_old__", "root_"."id", "root_"."title"  from "public"."post" as "root_"  where "root_"."id" = ?) 
							update  "public"."post" set  "author_id" =  "newData_"."author_id"   from "newData_"  where "post"."id" = "newData_"."id"  returning "author_id_old__"`,
					parameters: [testUuid(1), testUuid(2)],
					response: { rows: [{ author_id_old__: testUuid(99) }] },
				},
			]),
		],
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})

