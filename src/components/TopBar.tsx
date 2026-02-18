const TopBar = () => {
  return (
    <div className="h-12 bg-background-2 border-b border-border flex items-center justify-between px-5">
      <div className="flex items-center gap-2.5">
        <div className="w-[26px] h-[26px] bg-primary rounded-[7px] flex items-center justify-center font-mono text-[13px] font-semibold text-primary-foreground">
          L
        </div>
        <div className="text-sm font-semibold tracking-tight">LaunchAgent</div>
      </div>
      <div className="px-2.5 py-0.5 bg-success-dim border border-success-border rounded-full font-mono text-[10px] text-success font-semibold">
        Free Diagnosis
      </div>
    </div>
  );
};

export default TopBar;
