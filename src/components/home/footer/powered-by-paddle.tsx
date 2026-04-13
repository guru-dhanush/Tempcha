import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight } from 'lucide-react';

export function PoweredByPaddle() {
  return (
    <>
      <Separator className="footer-border" />
      <div className="flex flex-col justify-center items-center gap-2 text-muted-foreground text-sm leading-[14px] py-[24px]">
        <div className="flex justify-center items-center gap-2 flex-wrap">
          <span className="text-sm leading-[14px]">© 2025 Tempcha · Billing by</span>
          <Image src="/assets/icons/logo/paddle-white-logo.svg" alt="Paddle" width={54} height={14} />
        </div>
        <div className="flex justify-center items-center gap-3 flex-wrap md:flex-nowrap">
          <Link className="text-sm leading-[14px] hover:text-foreground transition-colors" href="/signup">
            <span className="flex items-center gap-1">
              Get started free <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link className="text-sm leading-[14px] hover:text-foreground transition-colors" href="/login">
            <span className="flex items-center gap-1">
              Sign in <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link className="text-sm leading-[14px] hover:text-foreground transition-colors" href="https://www.paddle.com/legal/privacy" target="_blank">
            <span className="flex items-center gap-1">
              Privacy <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
