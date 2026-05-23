import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  name?: string;
  inviteUrl: string;
}

export default function InvitationEmail({
  name,
  inviteUrl,
}: InvitationEmailProps) {
  const greeting = name ? `Hola ${name},` : "Hola,";

  return (
    <Html lang="es">
      <Head />
      <Preview>Eduardo te ha invitado a la Calculadora de Equivalencias de edureciofit</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>edureciofit</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Heading style={heading}>Tu acceso está listo 💪</Heading>
            <Text style={paragraph}>{greeting}</Text>
            <Text style={paragraph}>
              Eduardo Recio te ha dado acceso a la{" "}
              <strong>Calculadora de Equivalencias</strong> — una herramienta
              para intercambiar cualquier alimento de tu dieta por alternativas
              con los mismos macronutrientes.
            </Text>
            <Text style={paragraph}>
              Haz click en el botón de abajo para activar tu cuenta. El link
              es válido durante <strong>7 días</strong>.
            </Text>

            <Section style={buttonContainer}>
              <Button href={inviteUrl} style={button}>
                Activar mi cuenta
              </Button>
            </Section>

            <Text style={smallText}>
              O copia este link en tu navegador:{" "}
              <Link href={inviteUrl} style={link}>
                {inviteUrl}
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Si no esperabas este email, ignóralo. No se creará ninguna cuenta.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} edureciofit · Creando Gigantes
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#09090B",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "0 20px",
  maxWidth: "560px",
};

const header: React.CSSProperties = {
  padding: "32px 0 0",
};

const logo: React.CSSProperties = {
  color: "#3B82F6",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#18181B",
  borderRadius: "12px",
  padding: "32px",
  marginTop: "24px",
};

const heading: React.CSSProperties = {
  color: "#FAFAFA",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const paragraph: React.CSSProperties = {
  color: "#A1A1AA",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "28px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#3B82F6",
  borderRadius: "8px",
  color: "#FAFAFA",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const smallText: React.CSSProperties = {
  color: "#71717A",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#3B82F6",
  textDecoration: "none",
  wordBreak: "break-all",
};

const footer: React.CSSProperties = {
  padding: "20px 0 32px",
};

const footerText: React.CSSProperties = {
  color: "#52525B",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px",
  textAlign: "center",
};
