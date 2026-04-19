<script lang="ts">
  interface Tab {
    id: string;
    label: string;
    count?: number;
    disabled?: boolean;
  }

  interface Props {
    tabs: Tab[];
    value: string;
    onchange?: (id: string) => void;
  }

  let { tabs, value, onchange }: Props = $props();

  function handleSelect(tabId: string) {
    onchange?.(tabId);
  }

  function handleKeydown(event: KeyboardEvent, currentIndex: number) {
    let newIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
    }

    if (newIndex !== null) {
      const tab = tabs[newIndex];
      if (tab && !tab.disabled) {
        event.preventDefault();
        handleSelect(tab.id);
      }
    }
  }
</script>

<!-- UnoCSS class extraction hints (hidden, ensures dynamic classes are generated) -->
<span class="hidden border-primary text-primary-foreground bg-muted bg-card hover:bg-muted border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted bg-primary/10 text-primary bg-muted/50 text-muted-foreground dark:bg-muted dark:text-muted-foreground"></span>

<div class="mb-6" role="tablist" aria-label="Sections">
  <div class="border-b border-border">
    <nav class="-mb-px flex gap-6" aria-label="Tabs">
      {#each tabs as tab, i (tab.id)}
        <button
          role="tab"
          tabindex={value === tab.id ? 0 : -1}
          aria-selected={value === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          disabled={tab.disabled}
          onclick={() => onchange?.(tab.id)}
          onkeydown={(e) => handleKeydown(e, i)}
          class="py-3 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ease-out
                 whitespace-nowrap
                 {value === tab.id
                   ? 'border-primary text-primary bg-primary/10 dark:text-primary-foreground'
                   : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted'
                 }
                 {tab.disabled ? 'cursor-not-allowed opacity-50' : ''}"
        >
          {tab.label}
          {#if tab.count !== undefined}
            <span class="ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                         {value === tab.id
                           ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                           : 'bg-muted/50 text-muted-foreground'
                         }">
              {tab.count}
            </span>
          {/if}
        </button>
      {/each}
    </nav>
  </div>
</div>
