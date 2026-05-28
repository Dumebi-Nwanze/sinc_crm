import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export { supabase };

type Unsubscribe = () => void;
type RealtimeCallback = () => void;

interface ChannelEntry {
  channel: RealtimeChannel;
  callbacks: Set<RealtimeCallback>;
}

class RealtimeManager {
  private channels = new Map<string, ChannelEntry>();

  subscribeToThread(threadId: string, callback: RealtimeCallback): Unsubscribe {
    const channelKey = `messages:${threadId}`;

    return this.subscribe(channelKey, (channel) => {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => this.notify(channelKey),
      );
    }, callback);
  }

  subscribeToThreadList(callback: RealtimeCallback): Unsubscribe {
    const channelKey = "threads";

    return this.subscribe(channelKey, (channel) => {
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "conversation_threads",
          },
          () => this.notify(channelKey),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversation_threads",
          },
          () => this.notify(channelKey),
        );
    }, callback);
  }

  subscribeToDealNotes(dealId: string, callback: RealtimeCallback): Unsubscribe {
    const channelKey = `deal-notes:${dealId}`;

    return this.subscribe(channelKey, (channel) => {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_notes",
          filter: `deal_id=eq.${dealId}`,
        },
        () => this.notify(channelKey),
      );
    }, callback);
  }

  subscribeToDealStageHistory(
    dealId: string,
    callback: RealtimeCallback,
  ): Unsubscribe {
    const channelKey = `deal-stage-history:${dealId}`;

    return this.subscribe(channelKey, (channel) => {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_stage_history",
          filter: `deal_id=eq.${dealId}`,
        },
        () => this.notify(channelKey),
      );
    }, callback);
  }

  subscribeToDeal(dealId: string, callback: RealtimeCallback): Unsubscribe {
    const channelKey = `deal:${dealId}`;

    return this.subscribe(channelKey, (channel) => {
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "deal_notes",
            filter: `deal_id=eq.${dealId}`,
          },
          () => this.notify(channelKey),
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "deal_stage_history",
            filter: `deal_id=eq.${dealId}`,
          },
          () => this.notify(channelKey),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "deals",
            filter: `id=eq.${dealId}`,
          },
          () => this.notify(channelKey),
        );
    }, callback);
  }

  subscribeToPipeline(callback: RealtimeCallback): Unsubscribe {
    const channelKey = "deals";

    return this.subscribe(channelKey, (channel) => {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
        },
        () => this.notify(channelKey),
      );
    }, callback);
  }

  private subscribe(
    channelKey: string,
    setup: (channel: RealtimeChannel) => void,
    callback: RealtimeCallback,
  ): Unsubscribe {
    let entry = this.channels.get(channelKey);

    if (!entry) {
      const channel = supabase.channel(channelKey);
      setup(channel);
      void channel.subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`[realtime] ${channelKey} subscription failed`, status, err);
        }
      });
      entry = { channel, callbacks: new Set() };
      this.channels.set(channelKey, entry);
    }

    entry.callbacks.add(callback);

    return () => {
      const current = this.channels.get(channelKey);
      if (!current) return;

      current.callbacks.delete(callback);
      if (current.callbacks.size === 0) {
        void supabase.removeChannel(current.channel);
        this.channels.delete(channelKey);
      }
    };
  }

  private notify(channelKey: string): void {
    const entry = this.channels.get(channelKey);
    if (!entry) return;

    for (const cb of entry.callbacks) {
      cb();
    }
  }

  clear(): void {
    for (const entry of this.channels.values()) {
      void supabase.removeChannel(entry.channel);
    }
    this.channels.clear();
  }
}

let managerInstance: RealtimeManager | null = null;

export function createRealtimeManager(): RealtimeManager {
  if (!managerInstance) {
    managerInstance = new RealtimeManager();
  }
  return managerInstance;
}

export function resetRealtimeManager(): void {
  managerInstance?.clear();
  managerInstance = null;
}


