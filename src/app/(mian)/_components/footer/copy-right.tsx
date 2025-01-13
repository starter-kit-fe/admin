export default function CopyRight() {
  const year = new Date().getFullYear();
  return (
    <div className="w-full text-center text-muted-foreground text-xs">
      Copyright &copy; 2018-{year} All Rights Reserved.
    </div>
  );
}
