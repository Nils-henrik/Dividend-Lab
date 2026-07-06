import type { EventProvider } from "../../types/provider-contracts";
import {
  mockProviderRawEvents,
  type MockProviderRawEvent,
} from "./raw-events";

const MOCK_PROVIDER_ID = "mock";

export class MockEventProvider implements EventProvider<MockProviderRawEvent> {
  readonly providerId = MOCK_PROVIDER_ID;

  fetchRawEvents(): MockProviderRawEvent[] {
    return mockProviderRawEvents;
  }
}

export const mockEventProvider = new MockEventProvider();
