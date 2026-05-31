import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the header and dropzone in the empty state", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Webbit" })).toBeInTheDocument();
    expect(screen.getByText(/drop your png frames here/i)).toBeInTheDocument();
  });
});
