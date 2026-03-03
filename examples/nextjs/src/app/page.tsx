"use client";

import { Box, Typography, Card, CardContent, CardActionArea, Container, Stack } from "@mui/material";
import Link from "next/link";

const examples = [
  {
    title: "Basic Form",
    description: "Simple form with text, dropdown, toggle fields and validation",
    href: "/basic",
  },
  {
    title: "Business Rules",
    description: "Field dependencies, conditional visibility, component swapping, combo rules",
    href: "/business-rules",
  },
  {
    title: "Wizard Form",
    description: "Multi-step wizard with conditional steps and step validation",
    href: "/wizard",
  },
  {
    title: "Field Arrays",
    description: "Repeating sections with add/remove, min/max constraints",
    href: "/field-arrays",
  },
];

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Dynamic React Business Forms
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Configuration-driven forms with a declarative business rules engine.
        Choose an example below.
      </Typography>
      <Stack spacing={2}>
        {examples.map((ex) => (
          <Card key={ex.href} variant="outlined">
            <CardActionArea component={Link} href={ex.href}>
              <CardContent>
                <Typography variant="h6">{ex.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ex.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
