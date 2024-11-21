import { Button, Card, CardActions, CardContent, TextField, Typography } from "@mui/material";


export default function LoginRegisterForm() {
  return (
    <Card>
        <CardContent>
            <Typography variant="h4" sx={{ my: 2 }}>Registre-se</Typography>
        
            <TextField id="nome" label="Nome" variant="outlined" />

            <TextField id="nome" label="Nome" variant="outlined" />


            <CardActions>
                <Button size="small">Criar Conta</Button>
            </CardActions>
        </CardContent>
    </Card>
  );
}
