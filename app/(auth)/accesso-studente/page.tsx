import { getSimplifiedRegistrationMode } from './actions'
import { RegistrationForm } from './RegistrationForm'

export default async function AccessoStudentePage() {
  const simplifiedMode = await getSimplifiedRegistrationMode()

  return <RegistrationForm simplifiedMode={simplifiedMode} />
}
