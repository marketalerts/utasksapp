import StandardError from 'f/errors/ui/standard';
import { ErrorType } from 'f/errors/types';

export default function NotFound() {
  return <>
    {/* <Title>Not Found</Title> */}
    <StandardError type={ErrorType.HTTP} code="404" />
  </>;
}
