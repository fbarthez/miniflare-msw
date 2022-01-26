export async function handleRequest(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const phoneNumber = searchParams.get('phone_number')
  const apiResponse = await fetch(`https://some.domain.test/lookup?phone_number=${phoneNumber}`, {});
  return apiResponse
}
