import type { ControlOption } from '@formhaus/react/controls';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Radio from '@mui/material/Radio';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

export function ImageTiles({ options, value }: { options: ControlOption[]; value: unknown }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5, mt: 1 }}>
      {options.map((option) => (
        <Card
          key={option.value}
          component="label"
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            borderColor: value === option.value ? 'primary.main' : undefined,
            boxShadow: value === option.value ? (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}` : undefined,
          }}
        >
          {option.image && (
            <CardMedia
              component="img"
              image={option.image}
              alt=""
              sx={{ width: '100%', height: 'auto', aspectRatio: '4 / 3', objectFit: 'cover', flex: 'none' }}
            />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
            <Radio value={option.value} />
            <Typography>{option.label}</Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}

export function Segment({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <Box
      component="span"
      sx={(theme) => ({
        width: '100%',
        py: 1,
        border: 1,
        borderColor: 'divider',
        textAlign: 'center',
        typography: 'button',
        color: checked ? 'primary.main' : 'text.secondary',
        bgcolor: checked ? alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity) : undefined,
        '.Mui-focusVisible > &': { bgcolor: 'action.focus' },
      })}
    >
      {label}
    </Box>
  );
}
