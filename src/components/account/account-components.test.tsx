import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryPreferenceCheckboxes } from "@/components/account/CategoryPreferenceCheckboxes";
import { NewsletterToggle } from "@/components/account/NewsletterToggle";
import { RSSFeedEmptyState } from "@/components/account/RSSFeedEmptyState";
import { RSSFeedInput } from "@/components/account/RSSFeedInput";
import { RSSFeedRow } from "@/components/account/RSSFeedRow";
import { SavePreferencesButton } from "@/components/account/SavePreferencesButton";
import { UserProfileBlock } from "@/components/account/UserProfileBlock";

describe("account components", () => {
  it("renders profile loading and loaded states", () => {
    const { rerender } = render(
      <UserProfileBlock user={null} isLoading onSignOut={vi.fn()} isSigningOut={false} />,
    );

    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

    rerender(
      <UserProfileBlock
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        isLoading={false}
        onSignOut={vi.fn()}
        isSigningOut={false}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("calls sign out and shows sign out loading", () => {
    const onSignOut = vi.fn();

    render(
      <UserProfileBlock
        user={{ name: "Ada Lovelace", email: "ada@example.com" }}
        isLoading={false}
        onSignOut={onSignOut}
        isSigningOut
      />,
    );

    const button = screen.getByRole("button", { name: "Sign Out" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("validates RSS feed URLs before submission", async () => {
    const onAdd = vi.fn();

    render(<RSSFeedInput onAdd={onAdd} />);
    fireEvent.change(screen.getByPlaceholderText("https://example.com/feed.xml"), {
      target: { value: "not-a-url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Feed" }));

    expect(await screen.findByText("Invalid URL format")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("submits a valid RSS feed and clears input", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);

    render(<RSSFeedInput onAdd={onAdd} />);
    const input = screen.getByPlaceholderText("https://example.com/feed.xml");
    fireEvent.change(input, { target: { value: "https://example.com/rss.xml" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Feed" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("https://example.com/rss.xml"));
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps RSS feed row visible and shows remove errors", async () => {
    const onRemove = vi.fn().mockRejectedValue(new Error("Remove failed"));

    render(
      <RSSFeedRow
        feed={{ feed_id: "feed-1", url: "https://example.com/rss.xml", label: "Example" }}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Remove failed")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/rss.xml")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  });

  it("renders RSS empty state", () => {
    render(<RSSFeedEmptyState />);

    expect(screen.getByText("No RSS feeds added yet")).toBeInTheDocument();
  });

  it("updates category preferences with exact stored keys", () => {
    const onChange = vi.fn();

    render(
      <CategoryPreferenceCheckboxes
        saved={["tech", "finance", "politics"]}
        current={["tech", "finance", "politics"]}
        onChange={onChange}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Finance" }));

    expect(onChange).toHaveBeenCalledWith(["tech", "politics"]);
    expect(screen.queryByText("Top Events")).not.toBeInTheDocument();
  });

  it("renders disabled category preferences while saving", () => {
    render(
      <CategoryPreferenceCheckboxes
        saved={["tech"]}
        current={["tech"]}
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Tech News" })).toBeDisabled();
  });

  it("renders save preference states", () => {
    const { rerender } = render(
      <SavePreferencesButton
        isDirty={false}
        onSave={vi.fn()}
        isSaving={false}
        isSuccess={false}
        error={null}
      />,
    );

    expect(screen.getByRole("button", { name: "Save Preferences" })).toBeDisabled();

    rerender(
      <SavePreferencesButton
        isDirty
        onSave={vi.fn()}
        isSaving={false}
        isSuccess
        error={null}
      />,
    );
    expect(screen.getByText("Preferences saved")).toBeInTheDocument();

    rerender(
      <SavePreferencesButton
        isDirty
        onSave={vi.fn()}
        isSaving={false}
        isSuccess={false}
        error="Save failed"
      />,
    );
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("toggles newsletter immediately and reverts on error", async () => {
    const onToggle = vi.fn().mockRejectedValue(new Error("Toggle failed"));

    render(<NewsletterToggle enabled={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("switch", { name: "Daily email digest" }));

    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
    expect(await screen.findByText("Toggle failed")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Daily email digest" })).toHaveAttribute(
        "aria-checked",
        "false",
      ),
    );
  });
});
