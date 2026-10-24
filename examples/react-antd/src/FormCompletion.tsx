import { Button, Descriptions, Grid, Result } from 'antd';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  const screens = Grid.useBreakpoint();
  const items = answers(definition, values).map(({ key, label, value }) => ({ key, label, children: value }));
  return (
    <>
      <Result
        status="success"
        title={<h2 className="result-title">{completion.title}</h2>}
        subTitle={<span role="status">{completion.body}</span>}
        extra={
          <Button type="primary" onClick={onRestart}>
            {completion.again}
          </Button>
        }
      />
      <Descriptions
        title={completion.answers}
        column={1}
        size="small"
        layout={screens.sm ? 'horizontal' : 'vertical'}
        bordered
        items={items}
      />
    </>
  );
}
