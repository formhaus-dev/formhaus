import { definition } from '@/form/definition';
import { SignupForm } from './signup-form';

export default function Page() {
  return (
    <main>
      <h1>{definition.title}</h1>
      <SignupForm definition={definition} />
    </main>
  );
}
