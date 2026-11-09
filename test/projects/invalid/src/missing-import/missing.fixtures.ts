import { Fixtures } from '@dauflo/nest-fixtures'
// @ts-ignore the module does not exist anywhere, its resolution must keep failing
import { Missing } from 'src/does/not/exist'

export class MissingFixtures extends Fixtures {
    async load(): Promise<void> {
        console.log(Missing)
    }
}
