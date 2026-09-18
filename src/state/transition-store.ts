"use client";

import { createStore, useStore } from "./store";

interface TransitionState {
  phase: "idle" | "covering" | "covered" | "revealing";
}

export const transitionStore = createStore<TransitionState>({ phase: "idle" });

export function useTransition<S>(selector: (s: TransitionState) => S): S {
  return useStore(transitionStore, selector);
}

export const transition = {
  cover: () => transitionStore.setState({ phase: "covering" }),
  covered: () => transitionStore.setState({ phase: "covered" }),
  reveal: () => transitionStore.setState({ phase: "revealing" }),
  idle: () => transitionStore.setState({ phase: "idle" }),
};
