import Image from "next/image";
import Clyp from "@/public/clyp.png";
const Navbar = () => {
  return (
    <nav className='sticky left-0 right-0 mx-auto top-10 rounded-xl h-12 md:w-1/3 w-4/5 p-2 bg-neutral-300/20 backdrop-blur-[1px] border border-border/90 flex items-center justify-between'>
      <div className='flex items-center basis-1/3'>
        <Image
          src={Clyp}
          alt='Clyp'
          width={50}
          height={50}
          className='h-8 w-8'
        />
        <h1 className='text-xl font-bold ml-2'>Clyp</h1>
      </div>

      <div className='basis-3/5 flex justify-between items-center'>
        <p className='md:text-base text-xs opacity-70'>Record a Clyp</p>
        <Image
          src={Clyp}
          alt='Clyp'
          width={50}
          height={50}
          className='h-8 w-8'
        />
      </div>
    </nav>
  );
};

export default Navbar;
